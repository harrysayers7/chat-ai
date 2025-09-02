"use client";

import { useEffect, useState } from "react";
import { cn } from "lib/utils";

interface LongResponseIndicatorProps {
  isLoading: boolean;
  messageLength: number;
  className?: string;
}

export function LongResponseIndicator({ 
  isLoading, 
  messageLength, 
  className 
}: LongResponseIndicatorProps) {
  const [showIndicator, setShowIndicator] = useState(false);
  const [dots, setDots] = useState("");

  // Show indicator for long responses (more than 1000 characters)
  const isLongResponse = messageLength > 1000;

  useEffect(() => {
    if (isLoading && isLongResponse) {
      setShowIndicator(true);
    } else {
      setShowIndicator(false);
    }
  }, [isLoading, isLongResponse]);

  // Animate dots
  useEffect(() => {
    if (!showIndicator) return;

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === "...") return "";
        return prev + ".";
      });
    }, 500);

    return () => clearInterval(interval);
  }, [showIndicator]);

  if (!showIndicator) return null;

  return (
    <div className={cn(
      "flex items-center gap-2 text-sm text-muted-foreground p-2 bg-muted/50 rounded-lg border",
      className
    )}>
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
      </div>
      <span>Generating long response{dots}</span>
      <span className="text-xs opacity-70">Press Esc to stop</span>
    </div>
  );
}
