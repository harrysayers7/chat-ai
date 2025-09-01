"use client";

import React, { memo, useState, useEffect } from "react";
import { Check, X, AlertCircle, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimatedFeedbackProps {
  type: "success" | "error" | "warning" | "info" | "loading";
  message: string;
  duration?: number;
  onClose?: () => void;
  className?: string;
  showIcon?: boolean;
}

export const AnimatedFeedback = memo(function AnimatedFeedback({
  type,
  message,
  duration = 3000,
  onClose,
  className,
  showIcon = true,
}: AnimatedFeedbackProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0 && type !== "loading") {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, type]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 200);
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return <Check className="w-4 h-4" />;
      case "error":
        return <X className="w-4 h-4" />;
      case "warning":
        return <AlertCircle className="w-4 h-4" />;
      case "info":
        return <Info className="w-4 h-4" />;
      case "loading":
        return <Loader2 className="w-4 h-4 animate-spin" />;
      default:
        return null;
    }
  };

  const getColors = () => {
    switch (type) {
      case "success":
        return "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400";
      case "error":
        return "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400";
      case "warning":
        return "bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400";
      case "info":
        return "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400";
      case "loading":
        return "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400";
      default:
        return "bg-muted/10 border-muted/20 text-muted-foreground";
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 max-w-sm",
        "transform transition-all duration-200 ease-out",
        isExiting ? "opacity-0 translate-x-full" : "opacity-100 translate-x-0",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3 p-4 rounded-lg border backdrop-blur-sm shadow-lg",
          getColors(),
        )}
      >
        {showIcon && <div className="flex-shrink-0">{getIcon()}</div>}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{message}</p>
        </div>

        {onClose && type !== "loading" && (
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 rounded-md hover:bg-black/10 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
});
