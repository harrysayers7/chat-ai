"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, History, X } from "lucide-react";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { cn } from "@/lib/utils";

interface ChatHistoryTriggerProps {
  isOpen: boolean;
  onToggle: () => void;
  totalChats: number;
  className?: string;
}

export function ChatHistoryTrigger({
  isOpen,
  onToggle,
  totalChats,
  className,
}: ChatHistoryTriggerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Auto-hide when scrolling down, show when scrolling up
  // But don't hide when sidebar is open
  useEffect(() => {
    const handleScroll = () => {
      // Don't auto-hide if sidebar is open
      if (isOpen) {
        setIsVisible(true);
        return;
      }

      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollY;
      const isScrollingUp = currentScrollY < lastScrollY;

      if (isScrollingUp && currentScrollY > 100) {
        setIsVisible(true);
      } else if (isScrollingDown && currentScrollY > 200) {
        setIsVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, Boolean(isOpen)]);

  // Show on hover
  const handleMouseEnter = () => setIsVisible(true);
  const handleMouseLeave = () => {
    if (window.scrollY > 200) {
      setIsVisible(false);
    }
  };

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 z-50 transition-all duration-300 ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        className,
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative">
        {/* Main trigger button */}
        <Button
          onClick={onToggle}
          className={cn(
            "h-12 w-12 rounded-full shadow-lg transition-all duration-200",
            "bg-primary hover:bg-primary/90 text-primary-foreground",
            "hover:scale-105 active:scale-95",
            "border-2 border-background/20 hover:border-background/40",
            isOpen && "bg-primary/80",
          )}
          title={isOpen ? "Close chat history" : "Open chat history (Ctrl+J)"}
        >
          {isOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <MessageSquare className="w-5 h-5" />
          )}
        </Button>

        {/* Chat count badge */}
        {totalChats > 0 && !isOpen && (
          <Badge
            variant="secondary"
            className={cn(
              "absolute -top-1 -right-1 h-5 w-5 p-0 text-xs",
              "bg-background/90 border border-border/30",
              "animate-pulse",
            )}
          >
            {totalChats > 99 ? "99+" : totalChats}
          </Badge>
        )}

        {/* Tooltip on hover */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-foreground text-background text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
            {isOpen ? "Close chat history" : "Chat history"}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-foreground" />
          </div>
        </div>
      </div>

      {/* Keyboard shortcut hint */}
      {!isOpen && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 text-xs text-muted-foreground text-center whitespace-nowrap">
          <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+J</kbd>
        </div>
      )}
    </div>
  );
}
