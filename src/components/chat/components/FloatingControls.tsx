"use client";

import React from "react";
import { ChevronUp, BookOpen } from "lucide-react";
import type { FloatingControlsProps } from "../types";

export function FloatingControls({
  filteredTurns,
  showOnlyStarred,
  onToggleStarFilter,
  onExpandAll,
  onCollapseAll,
}: FloatingControlsProps) {
  const handleToggleAll = () => {
    // Check if most messages are collapsed or expanded
    const expandedCount = filteredTurns.filter((_, idx) => {
      const el = document.querySelector(`[data-turn-idx="${idx}"]`);
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
      onCollapseAll();
    } else {
      console.log("Expanding all...");
      onExpandAll();
    }
  };

  const handleToggleOlderChats = () => {
    // Toggle the master collapse for older chats
    const masterTrigger = document.querySelector(
      '[data-master-collapse="trigger"]',
    ) as HTMLElement;
    if (masterTrigger) {
      masterTrigger.click();
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2 py-2 px-3 bg-background/80 backdrop-blur-lg border border-border/30 rounded-2xl shadow-lg">
      <div className="flex gap-2">
        <button
          onClick={handleToggleAll}
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
          onClick={onToggleStarFilter}
          className={`w-5 h-5 rounded-md transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg backdrop-blur-md hover:scale-105 ${
            showOnlyStarred
              ? "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-400/40 hover:border-yellow-400/60"
              : "bg-background/60 hover:bg-background/80 text-muted-foreground border border-border/40 hover:border-border/60"
          }`}
          title={showOnlyStarred ? "Show all chats" : "Show only starred chats"}
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
            onClick={handleToggleOlderChats}
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
  );
}
