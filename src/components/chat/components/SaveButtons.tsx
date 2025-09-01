"use client";

import React from "react";
import { Save, HardDrive } from "lucide-react";
import type { Turn } from "../types";

interface SaveButtonsProps {
  turn: Turn;
}

export function SaveButtons({ turn }: SaveButtonsProps) {
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
