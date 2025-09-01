"use client";

import React, { useRef, useEffect, useMemo, useCallback } from "react";
import { FloatingControls } from "./components/FloatingControls";
import { PinnedChatsSection } from "./components/PinnedChatsSection";
import { OlderChatsSection } from "./components/OlderChatsSection";
import { CurrentMessageSection } from "./components/CurrentMessageSection";
import { ProjectTray } from "../ProjectTray";
import {
  convertMessagesToTurns,
  filterTurns,
  turnKey,
  debounce,
} from "./utils";
import type { CollapsibleChatProps } from "./types";

export function CollapsibleChat({
  messages,
  isLoading = false,
  onPoxyToolCall,
}: CollapsibleChatProps) {
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  // Stable ref callback to avoid re-renders
  const _setRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      refs.current[index] = el;
    },
    [],
  );

  const [pinned, setPinned] = React.useState<Record<string, boolean>>({});
  const [starred, setStarred] = React.useState<Record<string, boolean>>({});
  const [showOnlyStarred, setShowOnlyStarred] = React.useState(false);

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

  // Convert messages to turns format
  const turns = useMemo(() => convertMessagesToTurns(messages), [messages]);

  // Debounced state updates for better performance
  const debouncedSetPinned = useMemo(
    () =>
      debounce((key: string, value: boolean) => {
        setPinned((prev) => ({ ...prev, [key]: value }));
      }, 100),
    [],
  );

  const debouncedSetStarred = useMemo(
    () =>
      debounce((key: string, value: boolean) => {
        setStarred((prev) => ({ ...prev, [key]: value }));
      }, 100),
    [],
  );

  const togglePin = useCallback(
    (key: string) => {
      // Immediate visual feedback with optimistic update
      setPinned((prev) => {
        const newValue = !prev[key];
        // Also schedule debounced update for consistency
        debouncedSetPinned(key, newValue);
        return { ...prev, [key]: newValue };
      });
    },
    [debouncedSetPinned],
  );

  const toggleStar = useCallback(
    (key: string) => {
      // Immediate visual feedback with optimistic update
      setStarred((prev) => {
        const newValue = !prev[key];
        // Also schedule debounced update for consistency
        debouncedSetStarred(key, newValue);
        return { ...prev, [key]: newValue };
      });
    },
    [debouncedSetStarred],
  );

  // Filter turns based on starred filter
  const filteredTurns = useMemo(
    () => filterTurns(turns, starred, showOnlyStarred),
    [turns, starred, showOnlyStarred],
  );

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
        if (trigger && trigger.getAttribute("aria-expanded") === "true") {
          trigger.click();
        }
      });
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

  // Get the current/last message
  const currentTurn = filteredTurns.slice(-1)[0];
  const currentTurnKey = currentTurn
    ? turnKey(currentTurn) || String(filteredTurns.length - 1)
    : "";
  const currentIdx = filteredTurns.length - 1;

  return (
    <div className="w-full">
      <FloatingControls
        filteredTurns={filteredTurns}
        showOnlyStarred={showOnlyStarred}
        onToggleStarFilter={() => setShowOnlyStarred(!showOnlyStarred)}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
      />

      <PinnedChatsSection
        turns={turns}
        pinned={pinned}
        starred={starred}
        onTogglePin={togglePin}
        onToggleStar={toggleStar}
      />

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

      {currentTurn && (
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
      )}

      {/* Project Tray for saving code snippets */}
      <ProjectTray />
    </div>
  );
}
