"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, CheckSquare, FileText, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarContext } from "@/contexts/sidebar-context";

export function ContextMenu() {
  const { addItem } = useSidebarContext();
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState("");
  const [itemType, setItemType] = useState<"task" | "snippet" | "idea">(
    "snippet",
  );
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (text && text.length > 0) {
        e.preventDefault();
        setSelectedText(text);
        setPosition({ x: e.clientX, y: e.clientY });
        setIsVisible(true);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsVisible(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsVisible(false);
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleAddItem = () => {
    addItem({
      content: selectedText,
      type: itemType,
      source: "context menu",
    });
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-background border border-border rounded-lg shadow-lg p-3 min-w-64"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Selected text:</p>
          <p className="text-sm italic bg-muted p-2 rounded text-wrap break-words">
            &ldquo;{selectedText.slice(0, 100)}
            {selectedText.length > 100 ? "..." : ""}&rdquo;
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={itemType}
            onValueChange={(value: any) => setItemType(value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="task">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-3 w-3" />
                  Task
                </div>
              </SelectItem>
              <SelectItem value="snippet">
                <div className="flex items-center gap-2">
                  <FileText className="h-3 w-3" />
                  Snippet
                </div>
              </SelectItem>
              <SelectItem value="idea">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-3 w-3" />
                  Idea
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Button size="sm" onClick={handleAddItem}>
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
