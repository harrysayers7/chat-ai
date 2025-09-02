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
import { turnKey } from "../utils";

interface ChatTurn {
  index: number;
  userMessage: string;
  assistantMessage: string;
  displayText: string;
  timestamp: number;
  isPinned?: boolean;
  isStarred?: boolean;
}

interface ChatHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  turns: any[];
  pinned: Record<string, boolean>;
  starred: Record<string, boolean>;
  onJumpToChat: (turnIndex: number) => void;
}

export function ChatHistorySidebar({
  isOpen,
  onClose,
  turns,
  pinned,
  starred,
  onJumpToChat,
}: ChatHistorySidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleItemsLimit, setVisibleItemsLimit] = useState(20);
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [loadingSummaries, setLoadingSummaries] = useState<Set<string>>(
    new Set(),
  );
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Function to fetch AI summary for a turn
  const fetchSummary = useCallback(
    async (turnKey: string, userMessage: string) => {
      if (summaries[turnKey] || loadingSummaries.has(turnKey)) {
        return; // Already have summary or currently loading
      }

      setLoadingSummaries((prev) => new Set(prev).add(turnKey));

      try {
        const response = await fetch("/api/summarize", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: userMessage }),
        });

        if (response.ok) {
          const data = await response.json();
          setSummaries((prev) => ({ ...prev, [turnKey]: data.summary }));
        }
      } catch (error) {
        console.error("Failed to fetch summary:", error);
      } finally {
        setLoadingSummaries((prev) => {
          const newSet = new Set(prev);
          newSet.delete(turnKey);
          return newSet;
        });
      }
    },
    [summaries, loadingSummaries],
  );

  // Process turns into chat history items
  const chatHistory = useMemo(() => {
    if (!turns) return [];

    const items: ChatTurn[] = turns.map((turn, index) => {
      const key = turnKey(turn);
      const timestamp = new Date(turn.timestamp || Date.now()).getTime();

      // Create a better display text for the turn
      let displayText = "User message";
      const userContent = turn.user?.content || "";
      const assistantContent = turn.assistant?.content || "";

      if (userContent) {
        // Use AI summary if available, otherwise show truncated user message
        if (summaries[key]) {
          displayText = summaries[key];
        } else {
          displayText =
            userContent.length > 50
              ? userContent.substring(0, 50) + "..."
              : userContent;
        }
      }

      return {
        index, // This is the original index in the turns array
        userMessage: userContent || "User message",
        assistantMessage: assistantContent || "Assistant response",
        displayText,
        timestamp,
        isPinned: pinned[key] || false,
        isStarred: starred[key] || false,
      };
    });

    // Sort by timestamp but preserve the original index
    return items.sort((a, b) => b.timestamp - a.timestamp);
  }, [turns, pinned, starred, summaries]);

  // Fetch summaries when sidebar opens
  useEffect(() => {
    if (isOpen && turns.length > 0) {
      // Fetch summaries for the first few turns to start with
      turns.slice(0, 5).forEach((turn) => {
        const key = turnKey(turn);
        const userContent = turn.user?.content || "";
        if (userContent && !summaries[key] && !loadingSummaries.has(key)) {
          fetchSummary(key, userContent);
        }
      });
    }
  }, [isOpen, turns, summaries, loadingSummaries, fetchSummary]);

  // Filter chat history based on search
  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return chatHistory;

    const query = searchQuery.toLowerCase();
    return chatHistory.filter(
      (item) =>
        item.userMessage.toLowerCase().includes(query) ||
        item.assistantMessage.toLowerCase().includes(query),
    );
  }, [chatHistory, searchQuery]);

  // Group items by recency with virtual scrolling
  const groupedHistory = useMemo(() => {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;
    const oneWeek = 7 * oneDay;

    const groups = {
      recent: [] as ChatTurn[],
      today: [] as ChatTurn[],
      thisWeek: [] as ChatTurn[],
      older: [] as ChatTurn[],
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

  const handleJumpToTurn = useCallback(
    (item: ChatTurn) => {
      // The item.index is the original index in the unsorted turns array
      // We need to pass this directly to onJumpToChat
      onJumpToChat(item.index);
      onClose();
    },
    [onJumpToChat, onClose],
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
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Sidebar Panel */}
      <div
        className={cn(
          "fixed top-0 left-0 z-50 w-80 h-full bg-background border-r border-border/30 shadow-xl",
          "transform transition-all duration-300 ease-out flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full",
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
                    key={item.index}
                    item={item}
                    onNavigate={handleJumpToTurn}
                    loadingSummaries={loadingSummaries}
                    turns={turns}
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
                    key={item.index}
                    item={item}
                    onNavigate={handleJumpToTurn}
                    loadingSummaries={loadingSummaries}
                    turns={turns}
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
                    key={item.index}
                    item={item}
                    onNavigate={handleJumpToTurn}
                    loadingSummaries={loadingSummaries}
                    turns={turns}
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
                    key={item.index}
                    item={item}
                    onNavigate={handleJumpToTurn}
                    loadingSummaries={loadingSummaries}
                    turns={turns}
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
          <div>
            Press{" "}
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+J</kbd>{" "}
            to toggle
          </div>
          <div className="mt-1">Click to jump to conversation turns</div>
        </div>
      </div>
    </>
  );
}

// Individual chat history item component
function ChatHistoryItem({
  item,
  onNavigate,
  loadingSummaries,
  turns,
}: {
  item: ChatTurn;
  onNavigate: (item: ChatTurn) => void;
  loadingSummaries: Set<string>;
  turns: any[];
}) {
  const [showPreview, setShowPreview] = useState(false);

  const handleNavigate = useCallback(() => {
    onNavigate(item);
  }, [item, onNavigate]);

  const handleMouseEnter = useCallback(() => {
    setShowPreview(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setShowPreview(false);
  }, []);

  return (
    <div className="relative">
      <div
        onClick={handleNavigate}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="group flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer hover:bg-background/60"
      >
        {/* Icon */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted/40 flex items-center justify-center">
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-muted-foreground">
              Turn {item.index + 1}
            </span>
            {item.isPinned && <Pin className="w-3 h-3 text-yellow-500" />}
            {item.isStarred && <Star className="w-3 h-3 text-yellow-500" />}
          </div>
          <p className="text-sm text-foreground truncate font-medium">
            {item.displayText}
            {loadingSummaries.has(turnKey(turns[item.index])) && (
              <span className="ml-2 text-xs text-muted-foreground">
                Generating summary...
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {item.assistantMessage.length > 50
              ? item.assistantMessage.substring(0, 50) + "..."
              : item.assistantMessage}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
        </div>
      </div>

      {/* Preview Tooltip */}
      {showPreview && (
        <div className="absolute right-full top-0 mr-2 w-80 bg-background border border-border/30 rounded-lg shadow-xl z-50 p-3">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Turn {item.index + 1}</span>
          </div>

          <div className="space-y-2">
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">
                User:
              </div>
              <div className="text-sm text-foreground">
                {item.userMessage.length > 100
                  ? item.userMessage.substring(0, 100) + "..."
                  : item.userMessage}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">
                Assistant:
              </div>
              <div className="text-sm text-foreground">
                {item.assistantMessage.length > 100
                  ? item.assistantMessage.substring(0, 100) + "..."
                  : item.assistantMessage}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
