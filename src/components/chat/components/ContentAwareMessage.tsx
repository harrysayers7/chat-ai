"use client";

import React, { memo } from "react";
import {
  detectContentType,
  getContentTypeIcon,
  getContentTypeColor,
} from "../utils/contentDetector";
import { cn } from "@/lib/utils";

interface ContentAwareMessageProps {
  content: string;
  children: React.ReactNode;
  className?: string;
  showTypeIndicator?: boolean;
}

export const ContentAwareMessage = memo(function ContentAwareMessage({
  content,
  children,
  className,
  showTypeIndicator = true,
}: ContentAwareMessageProps) {
  const contentType = detectContentType(content);
  const typeIcon = getContentTypeIcon(contentType.type);
  const typeColor = getContentTypeColor(contentType.type);

  return (
    <div className={cn("relative group", className)}>
      {/* Content type indicator */}
      {showTypeIndicator && contentType.type !== "text" && (
        <div
          className={cn(
            "absolute -top-2 -left-2 px-2 py-1 rounded-full text-xs border",
            typeColor,
          )}
        >
          <span className="flex items-center gap-1">
            <span>{typeIcon}</span>
            <span className="capitalize">{contentType.type}</span>
          </span>
        </div>
      )}

      {/* Content */}
      <div
        className={cn(
          "rounded-lg p-4 transition-all duration-200",
          contentType.type === "text" ? "bg-background/40" : "bg-background/60",
        )}
      >
        {children}
      </div>

      {/* Content stats */}
      {showTypeIndicator && contentType.type !== "text" && (
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          {contentType.hasCode && (
            <span className="flex items-center gap-1">
              <span>Code</span>
            </span>
          )}
          {contentType.hasLinks && (
            <span className="flex items-center gap-1">
              <span>🔗</span>
              <span>
                {contentType.links.length} link
                {contentType.links.length !== 1 ? "s" : ""}
              </span>
            </span>
          )}
          {contentType.hasImages && (
            <span className="flex items-center gap-1">
              <span>🖼️</span>
              <span>
                {contentType.images.length} image
                {contentType.images.length !== 1 ? "s" : ""}
              </span>
            </span>
          )}
          <span className="flex items-center gap-1">
            <span>📝</span>
            <span>{contentType.wordCount} words</span>
          </span>
        </div>
      )}
    </div>
  );
});
