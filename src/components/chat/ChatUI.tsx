"use client";

import React, {
  useRef,
  useEffect,
  useMemo,
  useCallback,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { FloatingControls } from "./components/FloatingControls";
import { PinnedChatsSection } from "./components/PinnedChatsSection";
import { OlderChatsSection } from "./components/OlderChatsSection";
import { CurrentMessageSection } from "./components/CurrentMessageSection";
import { SearchAndFilter } from "./components/SearchAndFilter";
import { BulkOperations } from "./components/BulkOperations";
import { ProjectTray } from "../ProjectTray";
import { persistenceService, ChatPreferences } from "@/lib/persistence";
import { LoadingSkeleton } from "./components/LoadingSkeleton";
import { AnimatedFeedback } from "./components/AnimatedFeedback";
import { SmoothTransition } from "./components/SmoothTransition";
import { SettingsPanel } from "./components/SettingsPanel";
import { AIExplanationPopup } from "./components/AIExplanationPopup";
import { ChatHistorySidebar } from "./components/ChatHistorySidebar";
import { ChatHistoryTrigger } from "./components/ChatHistoryTrigger";
import { useAIExplanation } from "./hooks/useAIExplanation";
import {
  convertMessagesToTurns,
  filterTurns,
  turnKey,
  debounce,
} from "./utils";
import type { ChatUIProps } from "./types";

export function ChatUI({
  messages,
  isLoading = false,
  onPoxyToolCall,
}: ChatUIProps) {
  const router = useRouter();

  // AI Explanation functionality
  const { isPopupVisible, popupPosition, selectedText, hidePopup } =
    useAIExplanation();

  // Hover state for header controls
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);

  const handleExplain = async (text: string): Promise<string> => {
    try {
      const response = await fetch("/api/ai-explanation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          context: "From chat conversation",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get explanation");
      }

      const data = await response.json();
      return data.explanation;
    } catch (error) {
      console.error("AI explanation error:", error);
      throw error;
    }
  };
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  // Stable ref callback to avoid re-renders
  const _setRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      refs.current[index] = el;
    },
    [],
  );

  // Load preferences from persistence service
  const [preferences, setPreferences] = React.useState<ChatPreferences>(
    persistenceService.getPreferences(),
  );
  const [pinned, setPinned] = React.useState<Record<string, boolean>>(
    preferences.pinnedTurns,
  );
  const [starred, setStarred] = React.useState<Record<string, boolean>>(
    preferences.starredTurns,
  );
  const [showOnlyStarred, setShowOnlyStarred] = React.useState(
    preferences.showOnlyStarred,
  );

  // Search and filter state
  const [searchQuery, setSearchQuery] = React.useState(preferences.searchQuery);
  const [contentFilters, setContentFilters] = React.useState(
    preferences.contentFilters,
  );
  const [dateRange, setDateRange] = React.useState(preferences.dateRange);

  // Bulk operations state
  const [selectedTurns, setSelectedTurns] = React.useState<Set<string>>(
    new Set(preferences.selectedTurns),
  );
  const [showCheckboxes, setShowCheckboxes] = React.useState(
    preferences.showCheckboxes,
  );

  // Animation and feedback state
  const [showFeedback, setShowFeedback] = React.useState(false);
  const [feedbackMessage, setFeedbackMessage] = React.useState("");
  const [feedbackType, setFeedbackType] = React.useState<
    "success" | "error" | "info"
  >("success");

  // Chat history sidebar state
  const [isChatHistoryOpen, setIsChatHistoryOpen] = React.useState(false);

  // Scroll to bottom only when new messages are added (not on every mount)
  const hasScrolledToBottom = useRef(false);

  useEffect(() => {
    // Only scroll to bottom if we haven't already done so and there are messages
    if (!hasScrolledToBottom.current && messages.length > 0) {
      hasScrolledToBottom.current = true;
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
    }
  }, [messages.length]);

  // Keyboard shortcut for chat history
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "j") {
        e.preventDefault();
        setIsChatHistoryOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Jump to specific chat
  const _handleJumpToChat = useCallback((turnIndex: number) => {
    console.log("ChatUI handleJumpToChat called with turnIndex:", turnIndex);

    // Find the target turn element using the refs
    const targetElement = refs.current[turnIndex];

    if (targetElement) {
      console.log("Found target element for turn index:", turnIndex);

      // Scroll the target element into view
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });

      // Optional: Add a visual highlight effect
      targetElement.style.transition = "background-color 0.3s ease";
      targetElement.style.backgroundColor = "rgba(59, 130, 246, 0.1)"; // Light blue highlight

      // Remove highlight after a delay
      setTimeout(() => {
        targetElement.style.backgroundColor = "";
      }, 2000);
    } else {
      console.log("Could not find target element for turn index:", turnIndex);

      // Fallback: scroll to top if element not found
      setTimeout(() => {
        const container =
          document.querySelector(".flex-1.overflow-y-auto") ||
          document
            .querySelector('[data-master-collapse="trigger"]')
            ?.closest(".flex-1.overflow-y-auto") ||
          document.querySelector("main") ||
          document.querySelector("body");

        if (container) {
          container.scrollTo({
            top: 0,
            behavior: "smooth",
          });
        } else {
          window.scrollTo({
            top: 0,
            behavior: "smooth",
          });
        }
      }, 100);
    }
  }, []);

  // Convert messages to turns format
  const turns = useMemo(() => convertMessagesToTurns(messages), [messages]);

  // Debounced state updates for better performance
  const _debouncedSetPinned = useMemo(
    () =>
      debounce((key: string, value: boolean) => {
        setPinned((prev) => ({ ...prev, [key]: value }));
      }, 100),
    [],
  );

  const _debouncedSetStarred = useMemo(
    () =>
      debounce((key: string, value: boolean) => {
        setStarred((prev) => ({ ...prev, [key]: value }));
      }, 100),
    [],
  );

  // Save preferences when they change
  const savePreferences = useCallback(
    (updates: Partial<ChatPreferences>) => {
      const updated = { ...preferences, ...updates };
      setPreferences(updated);
      persistenceService.savePreferences(updated);
    },
    [preferences],
  );

  // Show feedback message
  const showFeedbackMessage = useCallback(
    (message: string, type: "success" | "error" | "info" = "success") => {
      setFeedbackMessage(message);
      setFeedbackType(type);
      setShowFeedback(true);
      setTimeout(() => setShowFeedback(false), 3000);
    },
    [],
  );

  const togglePin = useCallback(
    (key: string) => {
      const newValue = !pinned[key];
      const newPinned = { ...pinned, [key]: newValue };
      setPinned(newPinned);
      savePreferences({ pinnedTurns: newPinned });
      showFeedbackMessage(newValue ? "Message pinned" : "Message unpinned");
    },
    [pinned, savePreferences, showFeedbackMessage],
  );

  const toggleStar = useCallback(
    (key: string) => {
      const newValue = !starred[key];
      const newStarred = { ...starred, [key]: newValue };
      setStarred(newStarred);
      savePreferences({ starredTurns: newStarred });
      showFeedbackMessage(newValue ? "Message starred" : "Message unstarred");
    },
    [starred, savePreferences, showFeedbackMessage],
  );

  // Enhanced filtering with search and content filters
  const filteredTurns = useMemo(() => {
    let filtered = filterTurns(turns, starred, showOnlyStarred);

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((turn) => {
        const userContent = turn.user?.content?.toLowerCase() || "";
        const assistantContent = turn.assistant?.content?.toLowerCase() || "";
        return userContent.includes(query) || assistantContent.includes(query);
      });
    }

    // Apply content type filters
    filtered = filtered.filter((turn) => {
      const hasUser = !!turn.user;
      const hasAssistant = !!turn.assistant;

      if (!hasUser && !hasAssistant) return false;

      // Check content type filters
      const userContent = turn.user?.content || "";
      const assistantContent = turn.assistant?.content || "";

      const hasCode = /```[\s\S]*```|`[^`]+`/.test(
        userContent + assistantContent,
      );
      const hasLinks = /https?:\/\/[^\s]+/.test(userContent + assistantContent);
      const hasImages = /\.(jpg|jpeg|png|gif|webp|svg)(\?[^#\s]*)?$/i.test(
        userContent + assistantContent,
      );
      const hasText = !hasCode && !hasLinks && !hasImages;

      return (
        (hasCode && contentFilters.showCode) ||
        (hasLinks && contentFilters.showLinks) ||
        (hasImages && contentFilters.showImages) ||
        (hasText && contentFilters.showText)
      );
    });

    // Apply date range filter
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter((turn) => {
        const userTime = turn.user?.timestamp;
        const assistantTime = turn.assistant?.timestamp;
        const turnTime = userTime || assistantTime;

        if (!turnTime) return true; // Keep if no timestamp

        const turnDate = new Date(turnTime);
        const startDate = dateRange.start;
        const endDate = dateRange.end;

        if (startDate && turnDate < startDate) return false;
        if (endDate && turnDate > endDate) return false;

        return true;
      });
    }

    return filtered;
  }, [turns, starred, showOnlyStarred, searchQuery, contentFilters, dateRange]);

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
    // Use requestAnimationFrame for smoother performance
    requestAnimationFrame(() => {
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
    });
  }, [filteredTurns, pinned]);

  const collapseAll = useCallback(() => {
    console.log("collapseAll called, refs count:", refs.current.length);
    // Use requestAnimationFrame for smoother performance
    requestAnimationFrame(() => {
      refs.current.forEach((el, idx) => {
        if (!el) {
          console.log("No element at index:", idx);
          return;
        }

        // Skip pinned chats - they should always stay expanded
        const key = filteredTurns[idx]
          ? turnKey(filteredTurns[idx])
          : String(idx);
        if (pinned[key]) {
          console.log("Skipping pinned chat:", key);
          return;
        }

        const trigger = el?.querySelector<HTMLElement>(
          '[data-collapsible="trigger"]',
        );
        console.log("Found trigger for index", idx, ":", !!trigger);
        if (trigger) {
          const isExpanded = trigger.getAttribute("aria-expanded") === "true";
          console.log("Turn", idx, "is expanded:", isExpanded);
          if (isExpanded) {
            console.log("Collapsing turn:", idx, key);
            trigger.click();
          }
        }
      });
    });
  }, [filteredTurns, pinned]);

  // Bulk operations handlers
  const _handleToggleSelect = useCallback((turnKey: string) => {
    setSelectedTurns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(turnKey)) {
        newSet.delete(turnKey);
      } else {
        newSet.add(turnKey);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    const allTurnKeys = filteredTurns.map((turn) => turnKey(turn));
    setSelectedTurns(new Set(allTurnKeys));
  }, [filteredTurns]);

  const handleDeselectAll = useCallback(() => {
    setSelectedTurns(new Set());
  }, []);

  const handleBulkPin = useCallback(() => {
    selectedTurns.forEach((key) => {
      if (!pinned[key]) {
        togglePin(key);
      }
    });
    setSelectedTurns(new Set());
  }, [selectedTurns, pinned, togglePin]);

  const handleBulkStar = useCallback(() => {
    selectedTurns.forEach((key) => {
      if (!starred[key]) {
        toggleStar(key);
      }
    });
    setSelectedTurns(new Set());
  }, [selectedTurns, starred, toggleStar]);

  const handleBulkDelete = useCallback(() => {
    // This would need to be implemented based on your deletion logic
    console.log("Bulk delete:", Array.from(selectedTurns));
    setSelectedTurns(new Set());
  }, [selectedTurns]);

  // Safety check for messages after all hooks
  if (!messages || !Array.isArray(messages)) {
    console.warn("ChatUI: messages prop is not a valid array", messages);
    return (
      <div className="w-full p-4 text-center text-muted-foreground">
        No messages to display
      </div>
    );
  }

  // Get the current/last message
  const currentTurn = filteredTurns.slice(-1)[0];
  const currentTurnKey = currentTurn
    ? turnKey(currentTurn) || String(filteredTurns.length - 1)
    : "";
  const currentIdx = filteredTurns.length - 1;

  return (
    <div className="w-full">
      {/* Loading state */}
      {isLoading && (
        <SmoothTransition isVisible={isLoading} direction="up">
          <div className="mb-4">
            <LoadingSkeleton type="turn" />
          </div>
        </SmoothTransition>
      )}

      {/* Feedback messages */}
      {showFeedback && (
        <AnimatedFeedback
          type={feedbackType}
          message={feedbackMessage}
          onClose={() => setShowFeedback(false)}
        />
      )}

      <div
        className="flex items-center justify-between mb-4 transition-all duration-200 rounded-lg p-2"
        onMouseEnter={() => setIsHeaderHovered(true)}
        onMouseLeave={() => setIsHeaderHovered(false)}
        style={{
          opacity: isHeaderHovered ? 1 : 0.4,
          backgroundColor: isHeaderHovered
            ? "rgba(0, 0, 0, 0.05)"
            : "transparent",
        }}
      >
        <SearchAndFilter
          onSearchChange={setSearchQuery}
          onFilterChange={setContentFilters}
          onDateRangeChange={setDateRange}
          totalMessages={turns.length}
          filteredCount={filteredTurns.length}
        />
        <SettingsPanel />
      </div>

      <FloatingControls
        filteredTurns={filteredTurns}
        showOnlyStarred={showOnlyStarred}
        onToggleStarFilter={() => setShowOnlyStarred(!showOnlyStarred)}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
        onToggleBulkMode={() => setShowCheckboxes((prev) => !prev)}
        isBulkMode={showCheckboxes}
      />

      <SmoothTransition isVisible={true} direction="up" delay={100}>
        <PinnedChatsSection
          turns={turns}
          pinned={pinned}
          starred={starred}
          onTogglePin={togglePin}
          onToggleStar={toggleStar}
        />
      </SmoothTransition>

      <SmoothTransition isVisible={true} direction="up" delay={200}>
        <OlderChatsSection
          filteredTurns={filteredTurns}
          pinned={pinned}
          starred={starred}
          onTogglePin={togglePin}
          onToggleStar={toggleStar}
          onPoxyToolCall={onPoxyToolCall}
          refs={refs}
          shouldOpen={shouldOpen}
        />
      </SmoothTransition>

      {currentTurn && (
        <SmoothTransition isVisible={true} direction="up" delay={300}>
          <CurrentMessageSection
            turn={currentTurn}
            isPinned={!!pinned[currentTurnKey]}
            isStarred={!!starred[currentTurnKey]}
            onTogglePin={togglePin}
            onToggleStar={toggleStar}
            turnKey={currentTurnKey}
            onPoxyToolCall={onPoxyToolCall}
            refs={refs}
            idx={currentIdx}
          />
        </SmoothTransition>
      )}

      {/* Project Tray for saving code snippets */}
      <ProjectTray />

      {/* Bulk Operations Toolbar */}
      <BulkOperations
        selectedTurns={Array.from(selectedTurns)}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onBulkPin={handleBulkPin}
        onBulkStar={handleBulkStar}
        onBulkDelete={handleBulkDelete}
        totalTurns={filteredTurns.length}
      />

      {/* AI Explanation Popup */}
      <AIExplanationPopup
        isVisible={isPopupVisible}
        position={popupPosition}
        selectedText={selectedText}
        onClose={hidePopup}
        onExplain={handleExplain}
      />

      {/* Chat History Sidebar */}
      <ChatHistorySidebar
        isOpen={isChatHistoryOpen}
        onClose={() => setIsChatHistoryOpen(false)}
        onNavigateToThread={(threadId: string) => {
          router.push(`/chat/${threadId}`);
        }}
      />

      {/* Chat History Trigger Button */}
      <ChatHistoryTrigger
        isOpen={isChatHistoryOpen}
        onToggle={() => setIsChatHistoryOpen((prev) => !prev)}
        totalChats={turns.length}
      />
    </div>
  );
}
