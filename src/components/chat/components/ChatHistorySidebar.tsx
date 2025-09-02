"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  Search,
  X,
  Clock,
  Pin,
  Star,
  MessageSquare,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Badge } from "../../ui/badge";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { fetcher } from "lib/utils";
import { handleErrorWithToast } from "../../ui/shared-toast";
import useSWR from "swr";
import { ChatThread } from "app-types/chat";

interface ChatHistoryItem {
  id: string;
  thread: ChatThread;
  timestamp: number;
  preview: string;
  title: string;
}

interface ChatHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToThread: (threadId: string) => void;
}

export function ChatHistorySidebar({
  isOpen,
  onClose,
  onNavigateToThread,
}: ChatHistorySidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleItemsLimit, setVisibleItemsLimit] = useState(20);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const _router = useRouter();

  // Fetch chat threads
  const {
    data: threadList,
    isLoading,
    error,
  } = useSWR<ChatThread[]>("/api/thread", fetcher, {
    onError: handleErrorWithToast,
    fallbackData: [],
  });

  // Process threads into chat history items
  const chatHistory = useMemo(() => {
    if (!threadList) return [];

    const items: ChatHistoryItem[] = threadList.map((thread) => {
      const timestamp = new Date(
        thread.lastMessageAt || thread.createdAt,
      ).getTime();
      const title = thread.title || "Untitled Chat";

      // Create a preview from the last message or use title
      let preview = title;
      if (thread.lastMessage) {
        preview =
          thread.lastMessage.length > 50
            ? thread.lastMessage.substring(0, 50) + "..."
            : thread.lastMessage;
      }

      return {
        id: thread.id,
        thread,
        timestamp,
        preview,
        title,
      };
    });

    return items.sort((a, b) => b.timestamp - a.timestamp);
  }, [threadList]);

  // Filter chat history based on search
  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return chatHistory;

    const query = searchQuery.toLowerCase();
    return chatHistory.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.preview.toLowerCase().includes(query),
    );
  }, [chatHistory, searchQuery]);

  // Group items by recency with virtual scrolling
  const groupedHistory = useMemo(() => {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;
    const oneWeek = 7 * oneDay;

    const groups = {
      recent: [] as ChatHistoryItem[],
      today: [] as ChatHistoryItem[],
      thisWeek: [] as ChatHistoryItem[],
      older: [] as ChatHistoryItem[],
    };

    filteredHistory.forEach((item) => {
      const age = now - item.timestamp;
      if (age < oneHour) {
        groups.recent.push(item);
      } else if (age < oneDay) {
        groups.today.push(item);
      } else if (age < oneWeek) {
        groups.thisWeek.push(item);
      } else {
        groups.older.push(item);
      }
    });

    // Apply virtual scrolling limits
    return {
      recent: groups.recent.slice(0, visibleItemsLimit),
      today: groups.today.slice(0, visibleItemsLimit),
      thisWeek: groups.thisWeek.slice(0, visibleItemsLimit),
      older: groups.older.slice(0, visibleItemsLimit),
      hasMore: {
        recent: groups.recent.length > visibleItemsLimit,
        today: groups.today.length > visibleItemsLimit,
        thisWeek: groups.thisWeek.length > visibleItemsLimit,
        older: groups.older.length > visibleItemsLimit,
      },
    };
  }, [filteredHistory, visibleItemsLimit]);

  // Load more items
  const handleLoadMore = useCallback(() => {
    setVisibleItemsLimit((prev) => prev + 20);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "j") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // This would be handled by the parent component
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleNavigateToThread = useCallback(
    (item: ChatHistoryItem) => {
      // Navigate to the thread
      onNavigateToThread(item.thread.id);
      onClose();
    },
    [onNavigateToThread, onClose],
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    [],
  );

  const clearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div
        className={cn(
          "fixed bottom-0 left-0 z-50 w-80 max-h-[70vh] bg-background/95 backdrop-blur-lg border border-border/30 rounded-t-2xl shadow-xl",
          "transform transition-all duration-300 ease-out flex flex-col",
          isOpen ? "translate-y-0" : "translate-y-full",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-sm">Chat History</h3>
            <Badge variant="secondary" className="text-xs">
              {filteredHistory.length}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
        >
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading chats...
              </span>
            </div>
          )}

          {/* Recent */}
          {groupedHistory.recent.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Recent ({groupedHistory.recent.length})
              </h4>
              <div className="space-y-1">
                {groupedHistory.recent.map((item) => (
                  <ChatHistoryItem
                    key={item.id}
                    item={item}
                    onNavigate={handleNavigateToThread}
                  />
                ))}
                {groupedHistory.hasMore.recent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLoadMore}
                    className="w-full text-xs text-muted-foreground hover:text-foreground"
                  >
                    Load more recent chats...
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Today */}
          {groupedHistory.today.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">
                Today ({groupedHistory.today.length})
              </h4>
              <div className="space-y-1">
                {groupedHistory.today.map((item) => (
                  <ChatHistoryItem
                    key={item.id}
                    item={item}
                    onNavigate={handleNavigateToThread}
                  />
                ))}
                {groupedHistory.hasMore.today && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLoadMore}
                    className="w-full text-xs text-muted-foreground hover:text-foreground"
                  >
                    Load more from today...
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* This Week */}
          {groupedHistory.thisWeek.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">
                This Week ({groupedHistory.thisWeek.length})
              </h4>
              <div className="space-y-1">
                {groupedHistory.thisWeek.map((item) => (
                  <ChatHistoryItem
                    key={item.id}
                    item={item}
                    onNavigate={handleNavigateToThread}
                  />
                ))}
                {groupedHistory.hasMore.thisWeek && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLoadMore}
                    className="w-full text-xs text-muted-foreground hover:text-foreground"
                  >
                    Load more from this week...
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Older */}
          {groupedHistory.older.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">
                Older ({groupedHistory.older.length})
              </h4>
              <div className="space-y-1">
                {groupedHistory.older.map((item) => (
                  <ChatHistoryItem
                    key={item.id}
                    item={item}
                    onNavigate={handleNavigateToThread}
                  />
                ))}
                {groupedHistory.hasMore.older && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLoadMore}
                    className="w-full text-xs text-muted-foreground hover:text-foreground"
                  >
                    Load more older chats...
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredHistory.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No chats found</p>
              {searchQuery && (
                <p className="text-xs mt-1">Try a different search term</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/20 text-xs text-muted-foreground text-center">
          Press{" "}
          <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+J</kbd> to
          toggle
        </div>
      </div>
    </>
  );
}

// Individual chat history item component
function ChatHistoryItem({
  item,
  onNavigate,
}: {
  item: ChatHistoryItem;
  onNavigate: (item: ChatHistoryItem) => void;
}) {
  const handleNavigate = useCallback(() => {
    onNavigate(item);
  }, [item, onNavigate]);

  return (
    <div
      onClick={handleNavigate}
      className="group flex items-center gap-3 p-2 rounded-lg hover:bg-background/60 transition-colors cursor-pointer"
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted/40 flex items-center justify-center">
        <MessageSquare className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-muted-foreground">
            Chat
          </span>
        </div>
        <p className="text-sm text-foreground truncate font-medium">
          {item.title}
        </p>
        <p className="text-xs text-muted-foreground truncate">{item.preview}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight className="w-3 h-3 text-muted-foreground" />
      </div>
    </div>
  );
}
