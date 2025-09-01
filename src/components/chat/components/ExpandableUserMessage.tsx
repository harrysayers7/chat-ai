"use client";

import React from "react";
import {
  detectContentType,
  getContentTypeIcon,
  getContentTypeColor,
} from "../utils/contentDetector";

interface ExpandableUserMessageProps {
  content: string;
}

// Helper function to create smart preview using content detector
function createSmartPreview(content: string): {
  preview: string;
  hasCode: boolean;
  hasLinks: boolean;
  hasImages: boolean;
  wordCount: number;
  type: "text" | "code" | "mixed";
} {
  const contentType = detectContentType(content);
  const trimmed = content.trim();
  const words = trimmed.split(/\s+/);

  // Create intelligent preview
  let preview: string;
  if (contentType.type === "code") {
    // For code, show first few lines
    const lines = trimmed.split("\n");
    preview = lines.slice(0, 3).join("\n");
    if (lines.length > 3) preview += "\n...";
  } else if (contentType.hasLinks) {
    // For links, show the URL
    const urlMatch = trimmed.match(/https?:\/\/[^\s]+/);
    preview = urlMatch ? urlMatch[0] : words.slice(0, 8).join(" ");
  } else {
    // For text, show first meaningful sentence
    const sentences = trimmed.split(/[.!?]+/).filter(Boolean);
    if (sentences.length > 0) {
      preview = sentences[0].trim();
      if (preview.length > 60) {
        preview = preview.substring(0, 60) + "...";
      }
    } else {
      preview = words.slice(0, 8).join(" ");
    }
  }

  return {
    preview,
    hasCode: contentType.hasCode,
    hasLinks: contentType.hasLinks,
    hasImages: contentType.hasImages,
    wordCount: contentType.wordCount,
    type:
      contentType.type === "code"
        ? "code"
        : contentType.type === "mixed"
          ? "mixed"
          : "text",
  };
}

export function ExpandableUserMessage({ content }: ExpandableUserMessageProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const analysis = createSmartPreview(content);
  const shouldTruncate =
    analysis.wordCount > 15 || analysis.hasCode || analysis.hasLinks;

  // Content type indicators using content detector
  const contentType = detectContentType(content);
  const _typeIcon = getContentTypeIcon(contentType.type);
  const typeColor = getContentTypeColor(contentType.type);

  if (!shouldTruncate) {
    return (
      <div
        className={`rounded-full px-6 py-2 max-w-md transform transition-all duration-200 hover:scale-105 ${typeColor}`}
      >
        <div className="flex items-center">
          <span className="text-sm font-medium">{content}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl px-6 py-4 max-w-lg transform transition-all duration-200 hover:scale-105 ${typeColor}`}
    >
      <div className="flex items-start">
        <div className="flex-1 min-w-0">
          <div className="text-sm">
            {isExpanded ? (
              <div className="whitespace-pre-wrap font-medium">{content}</div>
            ) : (
              <div>
                <span className="font-semibold">{analysis.preview}</span>
                <div className="flex items-center gap-2 mt-3 text-xs opacity-70">
                  <span>{analysis.wordCount} words</span>
                  {analysis.hasCode && <span>• Code</span>}
                  {analysis.hasLinks && <span>• Links</span>}
                  {analysis.hasImages && <span>• Images</span>}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-3 text-xs text-gray-700 hover:text-gray-800 transition-colors font-semibold bg-sky-200/40 px-3 py-1 rounded-full hover:bg-sky-200/60"
          >
            {isExpanded
              ? "Show less"
              : `Show more (${analysis.wordCount} words)`}
          </button>
        </div>
      </div>
    </div>
  );
}
