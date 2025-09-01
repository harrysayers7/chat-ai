/**
 * Content detection utility for identifying different types of messages
 * in assistant responses that should be styled with colored boxes
 */

export type ContentType =
  | "summary"
  | "important"
  | "warning"
  | "flagged"
  | "default";

export interface DetectedContent {
  type: ContentType;
  content: string;
  originalText: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Detection patterns for different content types
 */
const DETECTION_PATTERNS = {
  summary: [
    /^(TLDR|TL;DR|Summary|In summary|To summarize|Briefly):\s*/i,
    /^(Here's a summary|Here is a summary):\s*/i,
    /^(Quick summary|Short summary):\s*/i,
  ],
  important: [
    /^(Important|Note|Remember|Keep in mind|Please note|Note that):\s*/i,
    /^(Key point|Main point|Essential):\s*/i,
    /^(Don't forget|Make sure|Ensure):\s*/i,
  ],
  warning: [
    /^(Warning|Caution|Be careful|Watch out):\s*/i,
    /^(⚠️|⚠)\s*/,
    /^(Danger|Risk|Hazard):\s*/i,
    /^(This could|This might|Be aware):\s*/i,
  ],
  flagged: [
    /^(Flagged|Alert|Critical|Urgent|Emergency):\s*/i,
    /^(🚨|🚩|❗|❌)\s*/,
    /^(Stop|Do not|Never|Avoid):\s*/i,
    /^(Security issue|Vulnerability|Error|Bug):\s*/i,
  ],
} as const;

/**
 * Color schemes for different content types
 */
export const CONTENT_COLORS = {
  summary: {
    light: "bg-gray-50 border-gray-200 text-gray-900",
    dark: "dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-100",
    icon: "text-gray-600 dark:text-gray-400",
  },
  important: {
    light: "bg-blue-50 border-blue-200 text-blue-900",
    dark: "dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-100",
    icon: "text-blue-600 dark:text-blue-400",
  },
  warning: {
    light: "bg-orange-50 border-orange-200 text-orange-900",
    dark: "dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-100",
    icon: "text-orange-600 dark:text-orange-400",
  },
  flagged: {
    light: "bg-red-50 border-red-200 text-red-900",
    dark: "dark:bg-red-900/20 dark:border-red-800 dark:text-red-100",
    icon: "text-red-600 dark:text-red-400",
  },
  default: {
    light: "bg-gray-50 border-gray-200 text-gray-900",
    dark: "dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-100",
    icon: "text-gray-600 dark:text-gray-400",
  },
} as const;

/**
 * Icons for different content types
 */
export const CONTENT_ICONS = {
  summary: "📋",
  important: "ℹ️",
  warning: "⚠️",
  flagged: "🚨",
  default: "📄",
} as const;

/**
 * Detect content type from a line of text
 */
export function detectContentType(text: string): ContentType {
  const trimmedText = text.trim();

  for (const [type, patterns] of Object.entries(DETECTION_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(trimmedText)) {
        return type as ContentType;
      }
    }
  }

  return "default";
}

/**
 * Extract content from text by removing the prefix
 */
export function extractContent(text: string, type: ContentType): string {
  if (type === "default") return text;

  const patterns = DETECTION_PATTERNS[type];
  let content = text;

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      content = content.replace(pattern, "").trim();
      break;
    }
  }

  return content;
}

/**
 * Parse text and detect all content blocks that should be styled
 */
export function parseContentBlocks(text: string): DetectedContent[] {
  const lines = text.split("\n");
  const detectedBlocks: DetectedContent[] = [];
  let currentIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const type = detectContentType(line);

    if (type !== "default") {
      const content = extractContent(line, type);
      const startIndex = currentIndex;
      const endIndex = currentIndex + line.length;

      detectedBlocks.push({
        type,
        content,
        originalText: line,
        startIndex,
        endIndex,
      });
    }

    currentIndex += line.length + 1; // +1 for newline
  }

  return detectedBlocks;
}

/**
 * Check if a text block should be wrapped in a content box
 */
export function shouldWrapInBox(text: string): boolean {
  const type = detectContentType(text);
  return type !== "default";
}

/**
 * Get the appropriate color classes for a content type
 */
export function getContentColors(type: ContentType): string {
  const colors = CONTENT_COLORS[type];
  return `${colors.light} ${colors.dark}`;
}

/**
 * Get the appropriate icon for a content type
 */
export function getContentIcon(type: ContentType): string {
  return CONTENT_ICONS[type];
}
