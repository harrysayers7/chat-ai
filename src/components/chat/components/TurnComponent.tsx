"use client";

import React, { memo, useState, useCallback } from "react";
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
import { truncateToWords } from "../utils";
import type { TurnComponentProps } from "../types";

export const TurnComponent = memo(function TurnComponent({
  turn,
  isPinned,
  isStarred,
  onTogglePin,
  onToggleStar,
  defaultOpen = false,
  turnKey,
  onPoxyToolCall,
}: TurnComponentProps) {
  // Lazy loading: only render content when expanded
  const [isExpanded, setIsExpanded] = useState(defaultOpen);
  const [hasBeenExpanded, setHasBeenExpanded] = useState(defaultOpen);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsExpanded(open);
      if (open && !hasBeenExpanded) {
        setHasBeenExpanded(true);
      }
    },
    [hasBeenExpanded],
  );
  const renderToolParts = (parts: any[], isLast = false) => {
    if (!parts || parts.length === 0) return null;

    return (
      <div className="mt-2 space-y-2">
        {parts.map((part, idx) => {
          const isLastPart = idx === (parts.length ?? 0) - 1;

          if (part.type === "tool-call") {
            const isManualToolInvocation =
              part.toolInvocation?.state === "partial-call";

            return (
              <div
                key={idx}
                className="p-3 bg-slate-800/40 rounded-lg border border-slate-600/30"
              >
                <div className="font-medium mb-1">
                  🔧 Tool: {part.toolInvocation?.toolName || "Unknown"}
                </div>
                <div className="text-xs text-gray-400">
                  {part.toolInvocation?.state === "result"
                    ? "Completed"
                    : "Executing..."}
                </div>

                {isManualToolInvocation &&
                  isLastPart &&
                  isLast &&
                  onPoxyToolCall && (
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() =>
                          onPoxyToolCall({ action: "manual", result: true })
                        }
                        className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() =>
                          onPoxyToolCall({ action: "manual", result: false })
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
    );
  };

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={handleOpenChange}
      className="overflow-hidden group mb-2 bg-background/20 rounded-lg p-1 hover:bg-background/30 transition-all duration-200"
    >
      <div className="w-full group">
        <div className="flex items-center justify-between px-3 py-2 bg-background/30 rounded-lg border border-border/30 hover:bg-background/40 transition-all duration-200">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="font-medium text-xs min-w-0 flex-1 text-foreground">
              {turn.user ? "" : "🤖"}
              {turn.user && (
                <div className="mt-0.5 text-xs text-muted-foreground truncate max-w-md">
                  {truncateToWords(turn.user.content, 10)}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onTogglePin(turnKey)}
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
              onClick={() => onToggleStar(turnKey)}
              className={`p-1 rounded-md transition-all duration-200 ${
                isStarred
                  ? "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-400/30 hover:border-yellow-400/50"
                  : "bg-background/40 hover:bg-background/60 text-muted-foreground border border-border/30 hover:border-border/50"
              }`}
              title={isStarred ? "Unstar" : "Star"}
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
        {/* Lazy loading: only render content after first expansion */}
        {hasBeenExpanded ? (
          <div className="p-3 text-sm space-y-4 border-t border-slate-600/20 mt-1">
            {turn.user && (
              <div className="space-y-2">
                <div className="flex justify-end">
                  <ExpandableUserMessage content={turn.user.content} />
                </div>
                <div className="flex items-center justify-end gap-1 mt-2">
                  <CopyButton content={turn.user.content} />
                </div>
              </div>
            )}

            {turn.assistant && (
              <div className="space-y-2 border-t border-border/20 pt-3">
                <div className="space-y-2">
                  <Markdown>{turn.assistant.content}</Markdown>
                  <div className="flex items-center justify-start">
                    <CopyButton content={turn.assistant.content} />
                  </div>

                  {renderToolParts(
                    turn.assistant.parts,
                    turn.assistant.isLastMessage,
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 text-sm text-center text-muted-foreground">
            Loading content...
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
});
