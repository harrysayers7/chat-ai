"use client";

import React, { memo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface SmoothTransitionProps {
  children: React.ReactNode;
  isVisible: boolean;
  duration?: number;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "fade" | "scale";
  className?: string;
  onEnter?: () => void;
  onExit?: () => void;
}

export const SmoothTransition = memo(function SmoothTransition({
  children,
  isVisible,
  duration = 300,
  delay = 0,
  direction = "fade",
  className,
  onEnter,
  onExit,
}: SmoothTransitionProps) {
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [_isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        onEnter?.();
      }, delay);
      return () => clearTimeout(timer);
    } else {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsTransitioning(false);
        onExit?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, delay, onEnter, onExit]);

  if (!shouldRender) return null;

  const getTransformClasses = () => {
    switch (direction) {
      case "up":
        return isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0";
      case "down":
        return isVisible
          ? "translate-y-0 opacity-100"
          : "-translate-y-4 opacity-0";
      case "left":
        return isVisible
          ? "translate-x-0 opacity-100"
          : "translate-x-4 opacity-0";
      case "right":
        return isVisible
          ? "translate-x-0 opacity-100"
          : "-translate-x-4 opacity-0";
      case "scale":
        return isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0";
      case "fade":
      default:
        return isVisible ? "opacity-100" : "opacity-0";
    }
  };

  return (
    <div
      className={cn(
        "transition-all ease-out",
        `duration-${Math.round(duration / 100)}`,
        getTransformClasses(),
        className,
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
});
