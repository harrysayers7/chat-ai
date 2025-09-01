"use client";

import React from "react";
import { Pin } from "lucide-react";
import { Markdown } from "../../markdown";
import { CopyButton } from "./CopyButton";
import { ExpandableUserMessage } from "./ExpandableUserMessage";
import { formatTimestamp, formatRelativeTimestamp } from "../utils";
import type { CurrentMessageSectionProps } from "../types";

export function CurrentMessageSection({
  turn,
  isPinned,
  isStarred,
  onTogglePin,
  onToggleStar,
  turnKey,
  onPoxyToolCall,
  refs,
  idx,
}: CurrentMessageSectionProps) {
  const renderToolParts = (parts: any[]) => {
    if (!parts || parts.length === 0) return null;

    return (
      <div className="mt-2 space-y-2">
        {parts.map((part, partIdx) => {
          const isLast = partIdx === (parts.length ?? 0) - 1;

          if (part.type === "tool-call") {
            const isManualToolInvocation =
              part.toolInvocation?.state === "partial-call";

            return (
              <div
                key={partIdx}
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

                {isManualToolInvocation && isLast && onPoxyToolCall && (
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
    <div className="border-t border-slate-600/40 pt-4 space-y-6">
      <div
        key={turnKey}
        ref={(el) => {
          if (el) refs.current[idx] = el;
        }}
      >
        <div className="mb-6">
          <div className="w-full group">
            <div className="flex items-center justify-between px-4 py-2 bg-background/60 rounded-2xl hover:bg-background/70 transition-all duration-200 shadow-md hover:shadow-lg border border-white/10">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="font-medium text-sm min-w-0 flex-1 text-muted-foreground">
                  {turn.user ? (
                    <div className="flex items-center gap-2">
                      <span>
                        {formatRelativeTimestamp(turn.user.timestamp)}
                      </span>
                      <span className="text-xs opacity-70">
                        {formatTimestamp()}
                      </span>
                    </div>
                  ) : (
                    "🤖 Assistant"
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 p-4 text-sm space-y-4">
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
              <div className="space-y-2 border-t border-border/30 pt-4">
                <div className="space-y-2">
                  <Markdown>{turn.assistant.content}</Markdown>
                  <div className="flex items-center justify-start gap-2">
                    <CopyButton content={turn.assistant.content} />

                    <button
                      onClick={() => onTogglePin(turnKey)}
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
                      onClick={() => onToggleStar(turnKey)}
                      className={`p-1 rounded-md transition-all duration-200 ${
                        isStarred
                          ? "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-400/30 hover:border-yellow-400/50"
                          : "bg-background/40 hover:bg-background/60 text-muted-foreground border border-border/30 hover:border-border/50"
                      }`}
                      title={isStarred ? "Unstar" : "Star"}
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

                  {renderToolParts(turn.assistant.parts)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
