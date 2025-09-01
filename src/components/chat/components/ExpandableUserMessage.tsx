"use client";

import React from "react";

interface ExpandableUserMessageProps {
  content: string;
}

export function ExpandableUserMessage({ content }: ExpandableUserMessageProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const words = content.trim().split(/\s+/);
  const shouldTruncate = words.length > 10;

  if (!shouldTruncate) {
    return (
      <div className="bg-gray-700/50 rounded-full px-4 py-0.5 border border-gray-600/30 max-w-xs">
        <span className="text-sm text-gray-200">{content}</span>
      </div>
    );
  }

  return (
    <div className="bg-gray-700/50 rounded-lg px-4 py-2 border border-gray-600/30 max-w-md">
      <span className="text-sm text-gray-200">
        {isExpanded ? content : words.slice(0, 10).join(" ") + "..."}
      </span>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
      >
        {isExpanded ? "Show less" : "Show more"}
      </button>
    </div>
  );
}
