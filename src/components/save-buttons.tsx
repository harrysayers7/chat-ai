"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Save, HardDrive } from "lucide-react";

interface SaveButtonsProps {
  threadId: string;
  onPoxyToolCall?: () => void;
}

export function SaveButtons({ threadId, onPoxyToolCall }: SaveButtonsProps) {
  const [saved, setSaved] = React.useState<"none" | "session" | "local">("none");

  const saveTemp = () => {
    // Save for this session
    if (typeof window !== 'undefined') {
      (window as any).__CHAT_AI_SAVED__ = (window as any).__CHAT_AI_SAVED__ ?? [];
      (window as any).__CHAT_AI_SAVED__.push({
        threadId,
        ts: Date.now(),
      });
      setSaved("session");
    }
  };
  
  const savePerm = () => {
    // Save on this device
    if (typeof window !== 'undefined') {
      try {
        const k = "chat-ai:saved-threads";
        const list = JSON.parse(localStorage.getItem(k) || "[]");
        list.push({
          threadId,
          ts: Date.now(),
        });
        localStorage.setItem(k, JSON.stringify(list));
        setSaved("local");
      } catch (error) {
        console.error('Failed to save thread:', error);
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={saveTemp}
        className="flex items-center gap-2"
        title="Save for this session"
      >
        <Save className="w-4 h-4" />
        Session
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={savePerm}
        className="flex items-center gap-2"
        title="Save on this device"
      >
        <HardDrive className="w-4 h-4" />
        Local
      </Button>
      {saved !== "none" && (
        <span className="text-xs text-green-600 ml-2">
          ✓ {saved}
        </span>
      )}
    </div>
  );
}
