"use client";

import React from "react";
import { ChevronUp } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible";
import { TurnComponent } from "./TurnComponent";
import { turnKey } from "../utils";
import type { OlderChatsSectionProps } from "../types";

export function OlderChatsSection({
  filteredTurns,
  pinned,
  starred,
  onTogglePin,
  onToggleStar,
  onPoxyToolCall,
  refs,
  shouldOpen,
}: OlderChatsSectionProps) {
  if (filteredTurns.length <= 2) {
    return null;
  }

  const olderTurns = filteredTurns.slice(0, -1);

  return (
    <div className="space-y-4">
      <Collapsible data-master-collapse="trigger" defaultOpen={false}>
        <CollapsibleTrigger className="w-full flex items-center justify-between p-3 rounded-lg bg-background/20 hover:bg-background/30 border border-border/20 hover:border-border/40 transition-all duration-200">
          <span className="text-sm font-medium text-muted-foreground">
            Older Chats ({olderTurns.length})
          </span>
          <ChevronUp className="w-4 h-4 text-muted-foreground transform transition-transform duration-200 group-data-[state=closed]:rotate-180" />
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-4">
          <div className="space-y-4">
            {olderTurns.map((t, idx) => {
              const key = turnKey(t) || String(idx);
              const defaultOpen = shouldOpen(idx, key);
              const isPinned = !!pinned[key];
              const isStarred = !!starred[key];

              return (
                <div
                  key={key}
                  data-turn-idx={idx}
                  ref={(el) => {
                    if (el) refs.current[idx] = el;
                  }}
                >
                  <TurnComponent
                    turn={t}
                    isPinned={isPinned}
                    isStarred={isStarred}
                    onTogglePin={onTogglePin}
                    onToggleStar={onToggleStar}
                    defaultOpen={defaultOpen}
                    turnKey={key}
                    onPoxyToolCall={onPoxyToolCall}
                  />
                </div>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
