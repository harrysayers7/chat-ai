"use client";

import { useChat } from "@ai-sdk/react";
import { toast } from "sonner";
import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import PromptInput from "./prompt-input";
import clsx from "clsx";
import { appStore } from "@/app/store";
import { cn, createDebounce, generateUUID, truncateString } from "lib/utils";
import { ErrorMessage, PreviewMessage } from "./message";
import { ChatGreeting } from "./chat-greeting";

import { useShallow } from "zustand/shallow";
import { UIMessage } from "ai";

import { safe } from "ts-safe";
import {
  ChatApiSchemaRequestBody,
  ChatModel,
  ClientToolInvocation,
} from "app-types/chat";
import { useToRef } from "@/hooks/use-latest";

import { Button } from "@/components/ui/button";
import { deleteThreadAction } from "@/app/api/chat/actions";
import { useRouter } from "next/navigation";
import { ArrowDown, Loader, BookOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import { Think } from "@/components/ui/think";
import { useGenerateThreadTitle } from "@/hooks/queries/use-generate-thread-title";
import dynamic from "next/dynamic";
import { useMounted } from "@/hooks/use-mounted";
import { getStorageManager } from "lib/browser-stroage";
import { AnimatePresence, motion } from "framer-motion";
import { PromptLibrarySidePanel } from "./prompt-library-side-panel";
import { PromptEditor } from "./prompt-editor";
import { CollapsibleChat } from "./chat";
import { useSidebarContextForAI } from "@/hooks/use-sidebar-context";

type Props = {
  threadId: string;
  initialMessages: Array<UIMessage>;
  selectedChatModel?: string;
  slots?: {
    emptySlot?: ReactNode;
    inputBottomSlot?: ReactNode;
  };
};

const Particles = dynamic(() => import("@/components/ui/particles"), {
  ssr: false,
});

const _debounce = createDebounce();

const firstTimeStorage = getStorageManager("IS_FIRST");
const isFirstTime = firstTimeStorage.get() ?? true;
firstTimeStorage.set(false);

export default function ChatBot({ threadId, initialMessages, slots }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sidebarContext = useSidebarContextForAI();
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const lastScrollTopRef = useRef(0);

  const [thinking, setThinking] = useState(false);

  const [
    appStoreMutate,
    model,
    toolChoice,
    allowedAppDefaultToolkit,
    allowedMcpServers,
    threadList,
    threadMentions,
    pendingThreadMention,
  ] = appStore(
    useShallow((state) => [
      state.mutate,
      state.chatModel,
      state.toolChoice,
      state.allowedAppDefaultToolkit,
      state.allowedMcpServers,
      state.threadList,
      state.threadMentions,
      state.pendingThreadMention,
    ]),
  );

  const generateTitle = useGenerateThreadTitle({
    threadId,
  });

  const [showParticles, setShowParticles] = useState(false); // Start with particles hidden to prevent initial jump
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    messages,
    input,
    setInput,
    append,
    status,
    addToolResult,
    error,
    stop,
  } = useChat({
    id: threadId,
    api: "/api/chat",
    initialMessages,
    experimental_prepareRequestBody: ({ messages, requestBody }) => {
      if (window.location.pathname !== `/chat/${threadId}`) {
        console.log("replace-state");
        window.history.replaceState({}, "", `/chat/${threadId}`);
      }
      const lastMessage = messages.at(-1)!;
      vercelAISdkV4ToolInvocationIssueCatcher(lastMessage);
      const request: ChatApiSchemaRequestBody = {
        id: latestRef.current.threadId,
        thinking,
        chatModel:
          (requestBody as { model: ChatModel })?.model ??
          latestRef.current.model,
        toolChoice: latestRef.current.toolChoice,
        allowedAppDefaultToolkit: latestRef.current.mentions?.length
          ? []
          : latestRef.current.allowedAppDefaultToolkit,
        allowedMcpServers: latestRef.current.mentions?.length
          ? {}
          : latestRef.current.allowedMcpServers,
        mentions: latestRef.current.mentions,
        message: lastMessage,
        sidebarContext,
      };
      return request;
    },
    sendExtraMessageFields: true,
    generateId: generateUUID,
    experimental_throttle: 100,
    onFinish() {
      const messages = latestRef.current.messages;
      const prevThread = latestRef.current.threadList.find(
        (v) => v.id === threadId,
      );
      const isNewThread =
        !prevThread?.title &&
        messages.filter((v) => v.role === "user" || v.role === "assistant")
          .length < 3;
      if (isNewThread) {
        const part = messages
          .slice(0, 2)
          .flatMap((m) =>
            m.parts
              .filter((v) => v.type === "text")
              .map((p) => `${m.role}: ${truncateString(p.text, 500)}`),
          );
        if (part.length > 0) {
          generateTitle(part.join("\n\n"));
        }
      }
    },
    onError: (error) => {
      console.error("Chat error:", error);
      setIsInitializing(false);
    },
  });

  // Set initializing to false once messages are loaded or after a timeout
  useEffect(() => {
    if (initialMessages.length > 0 || messages.length > 0) {
      setIsInitializing(false);
    } else {
      // If no messages, set initializing to false after a short delay
      const timer = setTimeout(() => {
        setIsInitializing(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [initialMessages.length, messages.length]);

  const [isDeleteThreadPopupOpen, setIsDeleteThreadPopupOpen] = useState(false);

  const mounted = useMounted();

  const latestRef = useToRef({
    toolChoice,
    model,
    allowedAppDefaultToolkit,
    allowedMcpServers,
    messages,
    threadList,
    threadId,
    mentions: threadMentions[threadId],
  });

  const isLoading = useMemo(
    () => status === "streaming" || status === "submitted",
    [status],
  );

  const emptyMessage = useMemo(
    () => messages.length === 0 && !error,
    [messages.length, error],
  );

  const isInitialThreadEntry = useMemo(
    () =>
      initialMessages.length > 0 &&
      initialMessages.at(-1)?.id === messages.at(-1)?.id,
    [messages],
  );

  const _needSpaceClass = useCallback(
    (index: number) => {
      if (error || isInitialThreadEntry || index != messages.length - 1)
        return false;
      const message = messages[index];
      if (message.role === "user") return false;
      if (message.parts.at(-1)?.type == "step-start") return false;
      return true;
    },
    [messages, error],
  );

  const [isExecutingProxyToolCall, setIsExecutingProxyToolCall] =
    useState(false);

  const isPendingToolCall = useMemo(() => {
    if (status != "ready") return false;
    const lastMessage = messages.at(-1);
    if (lastMessage?.role != "assistant") return false;
    const lastPart = lastMessage.parts.at(-1);
    if (!lastPart) return false;
    if (lastPart.type != "tool-invocation") return false;
    if (lastPart.toolInvocation.state == "result") return false;
    return true;
  }, [status, messages]);

  const proxyToolCall = useCallback((result: ClientToolInvocation) => {
    setIsExecutingProxyToolCall(true);
    return safe(async () => {
      const lastMessage = latestRef.current.messages.at(-1)!;
      const lastPart = lastMessage.parts.at(-1)! as Extract<
        UIMessage["parts"][number],
        { type: "tool-invocation" }
      >;
      return addToolResult({
        toolCallId: lastPart.toolInvocation.toolCallId,
        result,
      });
    })
      .watch(() => setIsExecutingProxyToolCall(false))
      .unwrap();
  }, []);

  const handleThinkingChange = useCallback((thinking: boolean) => {
    setThinking(thinking);
  }, []);

  const _space = useMemo(() => {
    if (!isLoading) return false;
    const lastMessage = messages.at(-1);
    if (lastMessage?.role == "user") return "think";
    const lastPart = lastMessage?.parts.at(-1);
    if (lastPart?.type == "step-start")
      return lastMessage?.parts.length == 1 ? "think" : "space";
    return false;
  }, [isLoading, messages.at(-1)]);

  const particle = useMemo(() => {
    if (!showParticles) return null;
    return <Particles className="absolute inset-0 pointer-events-none" />;
  }, [showParticles]);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isAtBottomNow = scrollTop + clientHeight >= scrollHeight - 10;
      setIsAtBottom(isAtBottomNow);
      lastScrollTopRef.current = scrollTop;
    }
  }, []);

  const handleKeyDown = useCallback((_e: KeyboardEvent) => {
    // Handle keyboard shortcuts here if needed
  }, []);

  const [_isScrollingToBottom, setIsScrollingToBottom] = useState(false);

  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      setIsScrollingToBottom(true);
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      setTimeout(() => setIsScrollingToBottom(false), 100);
    }
  }, []);

  const handleFocus = useCallback(() => {
    // Hide particles immediately when user is active
    if (showParticles) {
      setShowParticles(false);
    }

    // Clear any existing timeout
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }

    // Set a new timeout to show particles after 30 seconds of inactivity
    idleTimeoutRef.current = setTimeout(() => {
      setShowParticles(true);
    }, 30000);
  }, [showParticles]);

  const handleInsertPrompt = useCallback(
    (content: string) => {
      setInput(content);
    },
    [setInput],
  );

  const [isPromptEditorOpen, setIsPromptEditorOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<any>(null);

  useEffect(() => {
    appStoreMutate({ currentThreadId: threadId });
    return () => {
      appStoreMutate({ currentThreadId: null });
      // Clean up idle timeout
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
    };
  }, [threadId]);

  useEffect(() => {
    if (pendingThreadMention && threadId) {
      appStoreMutate((prev) => ({
        threadMentions: {
          ...prev.threadMentions,
          [threadId]: [pendingThreadMention],
        },
        pendingThreadMention: undefined,
      }));
    }
  }, [pendingThreadMention, threadId, appStoreMutate]);

  useEffect(() => {
    if (isInitialThreadEntry)
      containerRef.current?.scrollTo({
        top: containerRef.current?.scrollHeight,
        behavior: "instant",
      });
  }, [isInitialThreadEntry]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (mounted) {
      handleFocus();
    }
  }, [input, handleFocus]);

  // Add event listener for prompt library
  useEffect(() => {
    const handleOpenPromptLibrary = () => {
      setIsPromptLibraryOpen(true);
    };

    window.addEventListener("open-prompt-library", handleOpenPromptLibrary);
    return () =>
      window.removeEventListener(
        "open-prompt-library",
        handleOpenPromptLibrary,
      );
  }, []);

  // Add scroll event listener to track scroll position
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  // Scroll to bottom only on initial load, not on every message change
  const hasInitiallyScrolled = useRef(false);

  useEffect(() => {
    if (
      messages.length > 0 &&
      containerRef.current &&
      !hasInitiallyScrolled.current
    ) {
      hasInitiallyScrolled.current = true;
      const scrollToBottom = () => {
        if (containerRef.current) {
          containerRef.current.scrollTo({
            top: containerRef.current.scrollHeight,
            behavior: "instant",
          });
        }
      };

      // Small delay to ensure content is rendered
      const timer = setTimeout(scrollToBottom, 100);
      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  // Auto-scroll to bottom when new messages arrive, but only if user is already at bottom
  useEffect(() => {
    if (messages.length > 0 && containerRef.current) {
      const container = containerRef.current;
      const isAtBottom =
        container.scrollTop + container.clientHeight >=
        container.scrollHeight - 10;

      // Only auto-scroll if user is already at the bottom
      if (isAtBottom) {
        const scrollToBottom = () => {
          if (containerRef.current) {
            // Use smooth scrolling to prevent jarring jumps
            containerRef.current.scrollTo({
              top: containerRef.current.scrollHeight,
              behavior: "smooth",
            });
          }
        };

        // Small delay to ensure content is rendered
        const timer = setTimeout(scrollToBottom, 100);
        return () => clearTimeout(timer);
      } else {
        // If user is not at bottom, try to preserve their scroll position
        const restoreScrollPosition = () => {
          if (containerRef.current && lastScrollTopRef.current > 0) {
            containerRef.current.scrollTop = lastScrollTopRef.current;
          }
        };

        // Small delay to ensure content is rendered
        const timer = setTimeout(restoreScrollPosition, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [messages.length]);

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <div className="flex flex-col h-full w-full max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">
              Initializing chat...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {particle}
      <div
        className={cn(
          emptyMessage && "justify-center pb-24",
          "flex flex-col min-w-0 relative h-full",
        )}
      >
        {emptyMessage ? (
          slots?.emptySlot ? (
            slots.emptySlot
          ) : (
            <ChatGreeting />
          )
        ) : (
          <div className="flex flex-col h-full relative">
            {/* Chat Messages - Always Collapsible View */}
            <div
              className="flex-1 overflow-y-auto px-6 pb-40 max-w-4xl mx-auto w-full"
              ref={containerRef}
            >
              <CollapsibleChat
                messages={messages.map((msg) => ({
                  id: msg.id,
                  role: msg.role,
                  content: msg.parts
                    .filter((part) => part.type === "text")
                    .map((part) => part.text)
                    .join(" "),
                }))}
                onPoxyToolCall={
                  isPendingToolCall && !isExecutingProxyToolCall
                    ? () => proxyToolCall({ action: "manual", result: true })
                    : undefined
                }
              />
            </div>
          </div>
        )}

        <div
          className={clsx(
            messages.length && "absolute bottom-0",
            "w-full bg-gradient-to-t from-background via-background/95 to-transparent pt-8 pb-4",
          )}
        >
          <div className="max-w-3xl mx-auto relative flex justify-center items-center -top-2">
            <ScrollToBottomButton
              show={!isAtBottom && messages.length > 0}
              onClick={scrollToBottom}
              className=""
            />
          </div>

          <PromptInput
            input={input}
            threadId={threadId}
            append={append}
            thinking={thinking}
            setInput={setInput}
            onThinkingChange={handleThinkingChange}
            isLoading={isLoading || isPendingToolCall}
            onStop={stop}
            onFocus={isFirstTime ? undefined : handleFocus}
          />
          {slots?.inputBottomSlot}
        </div>
        <DeleteThreadPopup
          threadId={threadId}
          onClose={() => setIsDeleteThreadPopupOpen(false)}
          open={isDeleteThreadPopupOpen}
        />

        {/* Prompt Library Side Panel */}
        <PromptLibrarySidePanel
          isOpen={isPromptLibraryOpen}
          onClose={() => setIsPromptLibraryOpen(false)}
          onInsertPrompt={handleInsertPrompt}
        />

        {/* Prompt Editor Modal */}
        {isPromptEditorOpen && (
          <PromptEditor
            prompt={editingPrompt}
            categories={[
              {
                id: "1",
                name: "Development",
                color: "#3b82f6",
                userId: "user1",
              },
              {
                id: "2",
                name: "Communication",
                color: "#10b981",
                userId: "user1",
              },
              { id: "3", name: "Analysis", color: "#f59e0b", userId: "user1" },
              { id: "4", name: "Writing", color: "#8b5cf6", userId: "user1" },
            ]}
            onSave={(_prompt) => {
              // Handle saving the prompt
              // This would typically call an API
              setIsPromptEditorOpen(false);
              setEditingPrompt(null);
            }}
            onClose={() => {
              setIsPromptEditorOpen(false);
              setEditingPrompt(null);
            }}
          />
        )}
      </div>
    </>
  );
}

function vercelAISdkV4ToolInvocationIssueCatcher(message: UIMessage) {
  if (message.role != "assistant") return;
  const lastPart = message.parts.at(-1);
  if (lastPart?.type != "tool-invocation") return;
  if (!message.toolInvocations)
    message.toolInvocations = [lastPart.toolInvocation];
}

function DeleteThreadPopup({
  threadId,
  onClose,
  open,
}: { threadId: string; onClose: () => void; open: boolean }) {
  const t = useTranslations();
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const handleDelete = useCallback(() => {
    setIsDeleting(true);
    safe(() => deleteThreadAction(threadId))
      .watch(() => setIsDeleting(false))
      .ifOk(() => {
        toast.success(t("Chat.Thread.threadDeleted"));
        router.push("/");
      })
      .ifFail(() => toast.error(t("Chat.Thread.failedToDeleteThread")))
      .watch(() => onClose());
  }, [threadId, router]);
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("Chat.Thread.deleteChat")}</DialogTitle>
          <DialogDescription>
            {t("Chat.Thread.areYouSureYouWantToDeleteThisChatThread")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {t("Common.cancel")}
          </Button>
          <Button variant="destructive" onClick={handleDelete} autoFocus>
            {t("Common.delete")}
            {isDeleting && <Loader className="size-3.5 ml-2 animate-spin" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ScrollToBottomButtonProps {
  show: boolean;
  onClick: () => void;
  className?: string;
}

function ScrollToBottomButton({
  show,
  onClick,
  className,
}: ScrollToBottomButtonProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className={className}
        >
          <Button
            onClick={onClick}
            className="shadow-lg backdrop-blur-sm border transition-colors"
            size="icon"
            variant="ghost"
          >
            <ArrowDown />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
