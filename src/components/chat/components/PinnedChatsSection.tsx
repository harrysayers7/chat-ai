"use client";

import React from "react";
import { Pin, ChevronUp } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible";
import { Markdown } from "../../markdown";
import { CopyButton } from "./CopyButton";
import { SaveButtons } from "./SaveButtons";
import { ExpandableUserMessage } from "./ExpandableUserMessage";
import { turnKey, truncateToWords } from "../utils";
import type { PinnedChatsSectionProps } from "../types";

export function PinnedChatsSection({
  turns,
  pinned,
  starred,
  onTogglePin,
  onToggleStar,
}: PinnedChatsSectionProps) {
  const pinnedTurns = turns.filter((t, idx) => {
    const key = turnKey(t) || String(idx);
    return !!pinned[key];
  });

  if (pinnedTurns.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <Collapsible defaultOpen={false} className="overflow-hidden">
        <CollapsibleTrigger className="w-full flex items-center justify-between p-3 rounded-lg bg-background/20 hover:bg-background/30 border border-border/20 hover:border-border/40 transition-all duration-200">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-red-400">
              📌 Pinned Chats - Scrollable
            </span>
            <span className="text-xs text-muted-foreground">
              ({pinnedTurns.length})
            </span>
          </div>
          <ChevronUp className="w-4 h-4 text-muted-foreground transform transition-transform duration-200 group-data-[state=closed]:rotate-180" />
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-4">
          <div className="max-h-[50vh] overflow-y-auto space-y-4 p-4 border-2 border-green-200/30 rounded-lg bg-green-50/20 dark:bg-green-950/20 dark:border-green-800/30">
            {pinnedTurns.map((t, idx) => {
              const key = turnKey(t) || String(idx);
              const defaultOpen = false;
              const isPinned = !!pinned[key];
              const isStarred = !!starred[key];

              return (
                <div key={key}>
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
                          onClick={() => onTogglePin(key)}
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
                          onClick={() => onToggleStar(key)}
                          className={`p-1.5 rounded-md transition-all duration-200 ${
                            isStarred
                              ? "bg-yellow-500/30 hover:bg-yellow-500/40 text-yellow-300 border border-yellow-400/20"
                              : "bg-background/40 hover:bg-background/60 text-muted-foreground border border-border/30"
                          }`}
                          title={isStarred ? "Unstar" : "Star"}
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
                              <div className="flex items-center justify-start">
                                <CopyButton content={t.assistant.content} />
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
