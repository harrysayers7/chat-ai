"use client";

import React, { useRef, useEffect, useMemo, useCallback } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible";
import {
  Pin,
  Save,
  HardDrive,
  ChevronUp,
  BookOpen,
  User,
  Bot,
  Copy,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Markdown } from "./markdown";
import { ProjectTray } from "./ProjectTray";

// Define Turn type locally since it's not exported from types
interface Turn {
  user?: {
    id: string;
    content: string;
    isError: boolean;
  };

  assistant?: {
    id: string;
    content: string;
    isError: boolean;
    isLastMessage: boolean;
    parts: any[];
  };
}

// Helper function to generate unique keys for turns
function turnKey(t: Turn) {
  const a = t.user?.id ?? "";
  const b = t.assistant?.id ?? "";
  return [a, b].filter(Boolean).join(":");
}

// Helper function to truncate text to first 10 words
function truncateToWords(text: string, maxWords: number = 10): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "...";
}

// Helper function to format timestamp
function formatTimestamp(): string {
  const now = new Date();
  return now.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// Component for expandable user messages
function ExpandableUserMessage({ content }: { content: string }) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const words = content.trim().split(/\s+/);
  const shouldTruncate = words.length > 10;

  if (!shouldTruncate) {
    return (
      <div className="bg-gray-700/50 rounded-full px-4 py-0.5 border border-gray-600/30 max-w-xs">
        <span className="text-sm text-gray-200">{content}</span>
      </div>
    );
  }

  return (
    <div className="bg-gray-700/50 rounded-lg px-4 py-2 border border-gray-600/30 max-w-md">
      <span className="text-sm text-gray-200">
        {isExpanded ? content : words.slice(0, 10).join(" ") + "..."}
      </span>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
      >
        {isExpanded ? "Show less" : "Show more"}
      </button>
    </div>
  );
}

interface CollapsibleChatProps {
  messages: any[];
  isLoading?: boolean;
  onPoxyToolCall?: (data: any) => void;
}

export function CollapsibleChat({
  messages,
  isLoading = false,
  onPoxyToolCall,
}: CollapsibleChatProps) {
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  const [pinned, setPinned] = React.useState<Record<string, boolean>>({});
  const [starred, setStarred] = React.useState<Record<string, boolean>>({});
  const [showOnlyStarred, setShowOnlyStarred] = React.useState(false);

  // Scroll to bottom when component mounts
  useEffect(() => {
    // Small delay to ensure content is rendered
    const timer = setTimeout(() => {
      const container = document
        .querySelector('[data-master-collapse="trigger"]')
        ?.closest(".flex-1.overflow-y-auto");
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Convert messages to turns format
  const turns = useMemo(() => {
    if (!messages || !Array.isArray(messages)) return [];

    const result: Turn[] = [];
    let currentTurn: Partial<Turn> = {};

    messages.forEach((msg, idx) => {
      if (msg.role === "user") {
        // If we have a previous turn, save it
        if (currentTurn.user || currentTurn.assistant) {
          result.push(currentTurn as Turn);
        }
        // Start new turn
        currentTurn = {
          user: {
            id: msg.id || `user-${idx}`,
            content: msg.content || "",
            isError: false,
          },
        };
      } else if (msg.role === "assistant") {
        currentTurn.assistant = {
          id: msg.id || `assistant-${idx}`,
          content: msg.content || "",
          isError: false,
          isLastMessage: idx === messages.length - 1,
          parts: msg.parts || [],
        };
        // Save the turn
        result.push(currentTurn as Turn);
        currentTurn = {};
      }
    });

    // Don't forget the last turn if it only has a user message
    if (currentTurn.user && !currentTurn.assistant) {
      result.push(currentTurn as Turn);
    }

    return result;
  }, [messages]);

  const togglePin = useCallback((key: string) => {
    setPinned((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleStar = useCallback((key: string) => {
    setStarred((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Filter turns based on starred filter
  const filteredTurns = useMemo(() => {
    if (!showOnlyStarred) return turns;

    // When showing only starred, include:
    // 1. All starred chats
    // 2. The last chat (always visible)
    const _lastChatKey =
      turns.length > 0 ? turnKey(turns[turns.length - 1]) : "";

    return turns.filter((t, idx) => {
      const key = turnKey(t) || String(idx);
      const isLastChat = idx === turns.length - 1;
      const isStarred = !!starred[key];

      return isStarred || isLastChat;
    });
  }, [turns, starred, showOnlyStarred]);

  const shouldOpen = useCallback(
    (idx: number, key: string) => {
      // Always open pinned messages
      if (pinned[key]) return true;
      // Open the last message by default
      if (idx === filteredTurns.length - 1) return true;
      // Open messages with errors
      const turn = filteredTurns[idx];
      if (turn?.user?.isError || turn?.assistant?.isError) return true;
      return false;
    },
    [filteredTurns, pinned],
  );

  const expandAll = useCallback(() => {
    refs.current.forEach((el, idx) => {
      // Skip pinned chats - they should always stay expanded
      const key = filteredTurns[idx]
        ? turnKey(filteredTurns[idx])
        : String(idx);
      if (pinned[key]) return;

      const trigger = el?.querySelector<HTMLElement>(
        '[data-collapsible="trigger"]',
      );
      if (trigger && trigger.getAttribute("aria-expanded") === "false") {
        trigger.click();
      }
    });
  }, [filteredTurns, pinned]);

  const collapseAll = useCallback(() => {
    refs.current.forEach((el, idx) => {
      // Skip pinned chats - they should always stay expanded
      const key = filteredTurns[idx]
        ? turnKey(filteredTurns[idx])
        : String(idx);
      if (pinned[key]) return;

      const trigger = el?.querySelector<HTMLElement>(
        '[data-collapsible="trigger"]',
      );
      if (trigger && trigger.getAttribute("aria-expanded") === "true") {
        trigger.click();
      }
    });
  }, [filteredTurns, pinned]);

  // Safety check for messages after all hooks
  if (!messages || !Array.isArray(messages)) {
    console.warn(
      "CollapsibleChat: messages prop is not a valid array",
      messages,
    );
    return (
      <div className="w-full p-4 text-center text-muted-foreground">
        No messages to display
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Global controls - floating, always visible, far right */}
      <div className="fixed top-4 right-4 z-50 flex gap-2 py-2 px-3 bg-background/80 backdrop-blur-lg border border-border/30 rounded-2xl shadow-lg">
        <div className="flex gap-2">
          <button
            onClick={() => {
              // Check if most messages are collapsed or expanded
              const expandedCount = filteredTurns.filter((_, idx) => {
                const el = refs.current[idx];
                const trigger = el?.querySelector<HTMLElement>(
                  '[data-collapsible="trigger"]',
                );
                return trigger?.getAttribute("aria-expanded") === "true";
              }).length;

              console.log(
                "Total turns:",
                filteredTurns.length,
                "Expanded:",
                expandedCount,
              );

              // If more than half are expanded, collapse all; otherwise expand all
              if (expandedCount > filteredTurns.length / 2) {
                console.log("Collapsing all...");
                collapseAll();
              } else {
                console.log("Expanding all...");
                expandAll();
              }
            }}
            className="w-5 h-5 rounded-md bg-background/60 hover:bg-background/80 text-primary border border-primary/40 hover:border-primary/60 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg backdrop-blur-md hover:scale-105"
            title="Toggle all messages (expand/collapse)"
          >
            <ChevronUp className="w-2.5 h-2.5" />
          </button>
          <button
            onClick={() => {
              // Open prompt library side panel
              const event = new CustomEvent("open-prompt-library");
              window.dispatchEvent(event);
            }}
            className="w-5 h-5 rounded-md bg-background/60 hover:bg-background/80 text-primary border border-primary/40 hover:border-primary/60 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg backdrop-blur-md hover:scale-105"
            title="Prompt Library"
          >
            <BookOpen className="w-2.5 h-2.5" />
          </button>
          {/* Star filter toggle button */}
          <button
            onClick={() => setShowOnlyStarred((prev) => !prev)}
            className={`w-5 h-5 rounded-md transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg backdrop-blur-md hover:scale-105 ${
              showOnlyStarred
                ? "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-400/40 hover:border-yellow-400/60"
                : "bg-background/60 hover:bg-background/80 text-muted-foreground border border-border/40 hover:border-border/60"
            }`}
            title={
              showOnlyStarred ? "Show all chats" : "Show only starred chats"
            }
          >
            <svg
              className="w-2.5 h-2.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
          {/* Older Chats toggle button - floating */}
          {filteredTurns.length > 2 && (
            <button
              onClick={() => {
                // Toggle the master collapse for older chats
                const masterTrigger = document.querySelector(
                  '[data-master-collapse="trigger"]',
                ) as HTMLElement;
                if (masterTrigger) {
                  masterTrigger.click();
                }
              }}
              className="w-5 h-5 rounded-md bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-400/40 hover:border-orange-400/60 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg backdrop-blur-md hover:scale-105"
              title="Toggle Older Chats section"
            >
              <svg
                className="w-2.5 h-2.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Pinned chats - always visible, bypass all collapse mechanisms */}
      {(() => {
        const pinnedTurns = turns.filter((t, idx) => {
          const key = turnKey(t) || String(idx);
          return !!pinned[key];
        });

        if (pinnedTurns.length > 0) {
          return (
            <div className="mb-6">
              <Collapsible defaultOpen={false} className="overflow-hidden">
                <CollapsibleTrigger className="w-full flex items-center justify-between p-3 rounded-lg bg-background/20 hover:bg-background/30 border border-border/20 hover:border-border/40 transition-all duration-200">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-red-400">
                      📌 Pinned Chats
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({pinnedTurns.length})
                    </span>
                  </div>
                  <ChevronUp className="w-4 h-4 text-muted-foreground transform transition-transform duration-200 group-data-[state=closed]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                  <div className="space-y-4">
                    {pinnedTurns.map((t, idx) => {
                      const key = turnKey(t) || String(idx);
                      const defaultOpen = false;
                      const isPinned = !!pinned[key];
                      return (
                        <div
                          key={key}
                          ref={(el) => {
                            if (el) refs.current[filteredTurns.indexOf(t)] = el;
                          }}
                        >
                          <Collapsible
                            defaultOpen={defaultOpen}
                            className="overflow-hidden group mb-4 bg-background/20 rounded-lg p-1"
                          >
                            <div className="flex items-center justify-between px-3 py-2 bg-background/30 rounded-lg hover:bg-background/40 transition-all duration-200">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className="font-medium text-sm min-w-0 flex-1 text-foreground">
                                  {t.user ? "" : "🤖"}
                                  {t.user && (
                                    <div className="mt-1 text-xs text-muted-foreground truncate max-w-md">
                                      {truncateToWords(t.user.content, 10)}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <SaveButtons turn={t} />
                                <button
                                  onClick={() => togglePin(key)}
                                  className={`p-1.5 rounded-md transition-all duration-200 ${
                                    isPinned
                                      ? "bg-red-500/30 hover:bg-red-500/40 text-red-300 border border-red-400/20"
                                      : "bg-background/40 hover:bg-background/60 text-muted-foreground border border-border/30"
                                  }`}
                                  title={isPinned ? "Unpin" : "Pin"}
                                >
                                  <Pin className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => toggleStar(key)}
                                  className={`p-1.5 rounded-md transition-all duration-200 ${
                                    !!starred[key]
                                      ? "bg-yellow-500/30 hover:bg-yellow-500/40 text-yellow-300 border border-yellow-400/20"
                                      : "bg-background/40 hover:bg-background/60 text-muted-foreground border border-border/30"
                                  }`}
                                  title={!!starred[key] ? "Unstar" : "Star"}
                                >
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            <CollapsibleContent className="overflow-hidden">
                              <div className="p-4 text-sm space-y-4">
                                {t.user && (
                                  <div className="space-y-2">
                                    <div className="flex justify-end">
                                      <ExpandableUserMessage
                                        content={t.user.content}
                                      />
                                    </div>
                                    <div className="flex items-center justify-end gap-1 mt-2">
                                      <CopyButton content={t.user.content} />
                                    </div>
                                  </div>
                                )}
                                {t.assistant && (
                                  <div className="space-y-2 border-t border-border/30 pt-4">
                                    <div className="space-y-2">
                                      <Markdown>{t.assistant.content}</Markdown>
                                      <div className="flex items-center justify-start">
                                        <CopyButton
                                          content={t.assistant.content}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          );
        }
        return null;
      })()}

      {/* Regular chats with master collapse */}
      <div className="space-y-4">
        {filteredTurns.length > 2 && (
          <Collapsible data-master-collapse="trigger" defaultOpen={false}>
            <CollapsibleTrigger className="w-full flex items-center justify-between p-3 rounded-lg bg-background/20 hover:bg-background/30 border border-border/20 hover:border-border/40 transition-all duration-200">
              <span className="text-sm font-medium text-muted-foreground">
                Older Chats ({filteredTurns.length - 1})
              </span>
              <ChevronUp className="w-4 h-4 text-muted-foreground transform transition-transform duration-200 group-data-[state=closed]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <div className="space-y-4">
                {filteredTurns.slice(0, -1).map((t, idx) => {
                  const key = turnKey(t) || String(idx);
                  const defaultOpen = shouldOpen(idx, key);
                  const isPinned = !!pinned[key];
                  return (
                    <div
                      key={key}
                      ref={(el) => {
                        if (el) refs.current[idx] = el;
                      }}
                    >
                      <Collapsible
                        defaultOpen={defaultOpen}
                        className="overflow-hidden group mb-2 bg-background/20 rounded-lg p-1 hover:bg-background/30 transition-all duration-200"
                      >
                        <div className="w-full group">
                          <div className="flex items-center justify-between px-3 py-2 bg-background/30 rounded-lg border border-border/30 hover:bg-background/40 transition-all duration-200">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <div className="font-medium text-xs min-w-0 flex-1 text-foreground">
                                {t.user ? "" : "🤖"}
                                {t.user && (
                                  <div className="mt-0.5 text-xs text-muted-foreground truncate max-w-md">
                                    {truncateToWords(t.user.content, 10)}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => togglePin(key)}
                                className={`p-1 rounded-md transition-all duration-200 ${
                                  isPinned
                                    ? "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-400/30 hover:border-red-400/50"
                                    : "bg-background/40 hover:bg-background/60 text-muted-foreground border border-border/30 hover:border-border/50"
                                }`}
                                title={isPinned ? "Unpin" : "Pin"}
                              >
                                <Pin className="w-2.5 h-2.5" />
                              </button>
                              <button
                                onClick={() => toggleStar(key)}
                                className={`p-1 rounded-md transition-all duration-200 ${
                                  !!starred[key]
                                    ? "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-400/30 hover:border-yellow-400/50"
                                    : "bg-background/40 hover:bg-background/60 text-muted-foreground border border-border/30 hover:border-border/50"
                                }`}
                                title={!!starred[key] ? "Unstar" : "Star"}
                              >
                                <svg
                                  className="w-2.5 h-2.5"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                              </button>
                              <CollapsibleTrigger
                                data-collapsible="trigger"
                                className="flex items-center justify-center"
                              >
                                <ChevronUp className="w-3 h-3 text-slate-400 transform transition-transform duration-200 group-data-[state=closed]:rotate-180" />
                              </CollapsibleTrigger>
                            </div>
                          </div>
                        </div>
                        <CollapsibleContent className="overflow-hidden">
                          <div className="p-3 text-sm space-y-4 border-t border-slate-600/20 mt-1">
                            {t.user && (
                              <div className="space-y-2">
                                <div className="flex justify-end">
                                  <ExpandableUserMessage
                                    content={t.user.content}
                                  />
                                </div>
                                <div className="flex items-center justify-end gap-1 mt-2">
                                  <CopyButton content={t.user.content} />
                                </div>
                              </div>
                            )}
                            {t.assistant && (
                              <div className="space-y-2 border-t border-border/20 pt-3">
                                <div className="space-y-2">
                                  <Markdown>{t.assistant.content}</Markdown>
                                  <div className="flex items-center justify-start">
                                    <CopyButton content={t.assistant.content} />
                                  </div>
                                  {t.assistant.parts &&
                                    t.assistant.parts.length > 0 && (
                                      <div className="mt-2 space-y-2">
                                        {t.assistant.parts.map((part, idx) => {
                                          const isLast =
                                            idx ===
                                            (t.assistant?.parts?.length ?? 0) -
                                              1;
                                          if (part.type === "tool-call") {
                                            const isManualToolInvocation =
                                              part.toolInvocation?.state ===
                                              "partial-call";
                                            return (
                                              <div
                                                key={idx}
                                                className="p-2 bg-slate-800/40 rounded-lg border border-slate-600/30"
                                              >
                                                <div className="font-medium mb-1">
                                                  🔧 Tool:{" "}
                                                  {part.toolInvocation
                                                    ?.toolName || "Unknown"}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                  {part.toolInvocation
                                                    ?.state === "result"
                                                    ? "Completed"
                                                    : "Executing..."}
                                                </div>
                                                {isManualToolInvocation &&
                                                  isLast &&
                                                  onPoxyToolCall && (
                                                    <div className="mt-2 flex gap-2">
                                                      <button
                                                        onClick={() =>
                                                          onPoxyToolCall({
                                                            action: "manual",
                                                            result: true,
                                                          })
                                                        }
                                                        className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                                                      >
                                                        Approve
                                                      </button>
                                                      <button
                                                        onClick={() =>
                                                          onPoxyToolCall({
                                                            action: "manual",
                                                            result: false,
                                                          })
                                                        }
                                                        className="px-2 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                                                      >
                                                        Reject
                                                      </button>
                                                    </div>
                                                  )}
                                              </div>
                                            );
                                          } else if (
                                            part.type === "step-start"
                                          ) {
                                            return null;
                                          }
                                          return null;
                                        })}
                                      </div>
                                    )}
                                </div>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Last message - always visible */}
        <div className="border-t border-slate-600/40 pt-4 space-y-6">
          {filteredTurns.slice(-1).map((t, _relativeIdx) => {
            const idx = filteredTurns.length - 1;
            const key = turnKey(t) || String(idx);
            const _defaultOpen = shouldOpen(idx, key);
            const isPinned = !!pinned[key];
            return (
              <div
                key={key}
                ref={(el) => {
                  if (el) refs.current[idx] = el;
                }}
              >
                <div className="mb-6">
                  <div className="w-full group">
                    <div className="flex items-center justify-between px-4 py-2 bg-background/40 rounded-lg hover:bg-background/50 transition-all duration-200">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="font-medium text-sm min-w-0 flex-1 text-muted-foreground">
                          {t.user ? formatTimestamp() : "🤖"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mb-6 p-4 text-sm space-y-4">
                    {t.user && (
                      <div className="space-y-2">
                        <div className="flex justify-end">
                          <ExpandableUserMessage content={t.user.content} />
                        </div>
                        <div className="flex items-center justify-end gap-1 mt-2">
                          <CopyButton content={t.user.content} />
                        </div>
                      </div>
                    )}
                    {t.assistant && (
                      <div className="space-y-2 border-t border-border/30 pt-4">
                        <div className="space-y-2">
                          <Markdown>{t.assistant.content}</Markdown>
                          <div className="flex items-center justify-start gap-2">
                            <CopyButton content={t.assistant.content} />
                            <button
                              onClick={() => togglePin(key)}
                              className={`p-1 rounded-md transition-all duration-200 ${
                                isPinned
                                  ? "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-400/30 hover:border-red-400/50"
                                  : "bg-background/40 hover:bg-background/60 text-muted-foreground border border-border/30 hover:border-border/50"
                              }`}
                              title={isPinned ? "Unpin" : "Pin"}
                            >
                              <Pin className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => toggleStar(key)}
                              className={`p-1 rounded-md transition-all duration-200 ${
                                !!starred[key]
                                  ? "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-400/30 hover:border-yellow-400/50"
                                  : "bg-background/40 hover:bg-background/60 text-muted-foreground border border-border/30 hover:border-border/50"
                              }`}
                              title={!!starred[key] ? "Unstar" : "Star"}
                            >
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                            </button>
                          </div>
                          {t.assistant.parts &&
                            t.assistant.parts.length > 0 && (
                              <div className="mt-2 space-y-2">
                                {t.assistant.parts.map((part, idx) => {
                                  const isLast =
                                    idx ===
                                    (t.assistant?.parts?.length ?? 0) - 1;
                                  if (part.type === "tool-call") {
                                    const isManualToolInvocation =
                                      part.toolInvocation?.state ===
                                      "partial-call";
                                    return (
                                      <div
                                        key={idx}
                                        className="p-3 bg-slate-800/40 rounded-lg border border-slate-600/30"
                                      >
                                        <div className="font-medium mb-1">
                                          🔧 Tool:{" "}
                                          {part.toolInvocation?.toolName ||
                                            "Unknown"}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                          {part.toolInvocation?.state ===
                                          "result"
                                            ? "Completed"
                                            : "Executing..."}
                                        </div>
                                        {isManualToolInvocation &&
                                          isLast &&
                                          onPoxyToolCall && (
                                            <div className="mt-2 flex gap-2">
                                              <button
                                                onClick={() =>
                                                  onPoxyToolCall({
                                                    action: "manual",
                                                    result: true,
                                                  })
                                                }
                                                className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                                              >
                                                Approve
                                              </button>
                                              <button
                                                onClick={() =>
                                                  onPoxyToolCall({
                                                    action: "manual",
                                                    result: false,
                                                  })
                                                }
                                                className="px-2 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                                              >
                                                Reject
                                              </button>
                                            </div>
                                          )}
                                      </div>
                                    );
                                  } else if (part.type === "step-start") {
                                    return null;
                                  }
                                  return null;
                                })}
                              </div>
                            )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Project Tray for saving code snippets */}
      <ProjectTray />
    </div>
  );
}

function SaveButtons({ turn }: { turn: Turn }) {
  const [saved, setSaved] = React.useState<"none" | "session" | "local">(
    "none",
  );

  const payload = React.useMemo(
    () => ({
      user: turn.user?.content ?? "",
      assistant: turn.assistant?.content ?? "",
      ts: Date.now(),
    }),
    [turn.user?.content, turn.assistant?.content],
  );

  const saveTemp = () => {
    (window as any).__CHAT_AI_SAVED__ = (window as any).__CHAT_AI_SAVED__ ?? [];
    (window as any).__CHAT_AI_SAVED__.push(payload);
    setSaved("session");
  };

  const savePerm = () => {
    if (typeof window !== "undefined") {
      try {
        const k = "chat-ai:saved-turns";
        const list = JSON.parse(localStorage.getItem(k) || "[]");
        list.push(payload);
        localStorage.setItem(k, JSON.stringify(list));
        setSaved("local");
      } catch {}
    }
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={saveTemp}
        className="p-2 text-xs rounded-md bg-background/60 hover:bg-background/80 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
        title="Save for this session"
      >
        <Save className="w-3 h-3" />
      </button>
      <button
        onClick={savePerm}
        className="p-2 text-xs rounded-md bg-background/50 hover:bg-background transition-colors"
        title="Save on this device"
      >
        <HardDrive className="w-3 h-3" />
      </button>
      {saved !== "none" && (
        <span className="text-[10px] text-muted-foreground ml-1">
          ✓ {saved}
        </span>
      )}
    </div>
  );
}

function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-2 text-xs rounded-md bg-background/50 hover:bg-background transition-colors"
      title="Copy response"
    >
      {copied ? (
        <svg
          className="w-3 h-3 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ) : (
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      )}
    </button>
  );
}
