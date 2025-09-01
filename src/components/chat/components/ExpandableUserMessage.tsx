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
  const typeIcon = getContentTypeIcon(contentType.type);
  const typeColor = getContentTypeColor(contentType.type);

  if (!shouldTruncate) {
    return (
      <div className={`rounded-full px-4 py-0.5 border max-w-xs ${typeColor}`}>
        <div className="flex items-center gap-2">
          <span className="text-xs opacity-70">{typeIcon}</span>
          <span className="text-sm text-gray-200">{content}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg px-4 py-3 border max-w-md ${typeColor}`}>
      <div className="flex items-start gap-2">
        <span className="text-xs opacity-70 mt-0.5">{typeIcon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-gray-200">
            {isExpanded ? (
              <div className="whitespace-pre-wrap">{content}</div>
            ) : (
              <div>
                <span className="font-medium">{analysis.preview}</span>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
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
            className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
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
