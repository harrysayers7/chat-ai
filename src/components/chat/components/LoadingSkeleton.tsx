"use client";

import React, { memo } from "react";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  type?: "message" | "turn" | "content" | "image" | "link";
  className?: string;
}

export const LoadingSkeleton = memo(function LoadingSkeleton({
  type = "message",
  className,
}: LoadingSkeletonProps) {
  const baseClasses = "animate-pulse bg-muted/20 rounded";

  switch (type) {
    case "message":
      return (
        <div className={cn("space-y-3", className)}>
          <div className={cn(baseClasses, "h-4 w-3/4")} />
          <div className={cn(baseClasses, "h-4 w-1/2")} />
          <div className={cn(baseClasses, "h-4 w-5/6")} />
        </div>
      );

    case "turn":
      return (
        <div className={cn("space-y-4", className)}>
          <div className="flex items-center gap-3">
            <div className={cn(baseClasses, "w-8 h-8 rounded-full")} />
            <div className="flex-1 space-y-2">
              <div className={cn(baseClasses, "h-4 w-1/4")} />
              <div className={cn(baseClasses, "h-3 w-1/3")} />
            </div>
          </div>
          <div className="space-y-2">
            <div className={cn(baseClasses, "h-4 w-full")} />
            <div className={cn(baseClasses, "h-4 w-3/4")} />
            <div className={cn(baseClasses, "h-4 w-1/2")} />
          </div>
        </div>
      );

    case "content":
      return (
        <div className={cn("space-y-2", className)}>
          <div className={cn(baseClasses, "h-4 w-full")} />
          <div className={cn(baseClasses, "h-4 w-5/6")} />
          <div className={cn(baseClasses, "h-4 w-4/5")} />
          <div className={cn(baseClasses, "h-4 w-3/4")} />
        </div>
      );

    case "image":
      return (
        <div className={cn("space-y-2", className)}>
          <div className={cn(baseClasses, "h-48 w-full rounded-lg")} />
          <div className={cn(baseClasses, "h-4 w-1/3")} />
        </div>
      );

    case "link":
      return (
        <div className={cn("space-y-3", className)}>
          <div className="flex items-center gap-3">
            <div className={cn(baseClasses, "w-6 h-6 rounded")} />
            <div className="flex-1 space-y-2">
              <div className={cn(baseClasses, "h-4 w-2/3")} />
              <div className={cn(baseClasses, "h-3 w-1/2")} />
            </div>
          </div>
        </div>
      );

    default:
      return <div className={cn(baseClasses, "h-4 w-full", className)} />;
  }
});
