export interface ContentTypeInfo {
  type:
    | "text"
    | "code"
    | "link"
    | "image"
    | "video"
    | "audio"
    | "file"
    | "mixed";
  language?: string;
  hasCode: boolean;
  hasLinks: boolean;
  hasImages: boolean;
  hasFiles: boolean;
  wordCount: number;
  links: string[];
  images: string[];
}

export function detectContentType(content: string): ContentTypeInfo {
  const links = extractLinks(content);
  const images = extractImages(content);
  const codeBlocks = extractCodeBlocks(content);
  const wordCount = content
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  const hasCode = codeBlocks.length > 0;
  const hasLinks = links.length > 0;
  const hasImages = images.length > 0;
  const hasFiles = hasFileExtensions(content);

  // Determine primary content type
  let type: ContentTypeInfo["type"] = "text";

  if (hasCode && !hasLinks && !hasImages) {
    type = "code";
  } else if (hasLinks && !hasCode && !hasImages) {
    type = "link";
  } else if (hasImages && !hasCode && !hasLinks) {
    type = "image";
  } else if (hasCode || hasLinks || hasImages) {
    type = "mixed";
  }

  return {
    type,
    language: codeBlocks[0]?.language,
    hasCode,
    hasLinks,
    hasImages,
    hasFiles,
    wordCount,
    links,
    images,
  };
}

function extractLinks(content: string): string[] {
  const urlRegex = /https?:\/\/[^\s]+/g;
  return content.match(urlRegex) || [];
}

function extractImages(content: string): string[] {
  const imageRegex =
    /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?[^\s]*)?/gi;
  return content.match(imageRegex) || [];
}

function extractCodeBlocks(
  content: string,
): Array<{ language: string; code: string }> {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const blocks: Array<{ language: string; code: string }> = [];

  let match;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    blocks.push({
      language: match[1] || "text",
      code: match[2],
    });
  }

  return blocks;
}

function hasFileExtensions(content: string): boolean {
  const fileExtensions =
    /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|tar|gz|mp3|mp4|avi|mov|wav|txt|csv|json|xml|yaml|yml|md|html|css|js|ts|py|java|c|cpp|h|php|rb|go|rs|swift|kt|dart|r|sql|sh|ps1|bat|exe|dmg|deb|rpm|apk|ipa)$/i;
  return fileExtensions.test(content);
}

export function getContentTypeIcon(type: ContentTypeInfo["type"]): string {
  switch (type) {
    case "code":
      return "";
    case "link":
      return "";
    case "image":
      return "";
    case "video":
      return "";
    case "audio":
      return "";
    case "file":
      return "";
    case "mixed":
      return "";
    default:
      return "";
  }
}

export function getContentTypeColor(type: ContentTypeInfo["type"]): string {
  switch (type) {
    case "code":
      return "bg-sky-300/60 text-gray-800 shadow-lg";
    case "link":
      return "bg-sky-300/50 text-gray-800 shadow-lg";
    case "image":
      return "bg-sky-300/50 text-gray-800 shadow-lg";
    case "video":
      return "bg-sky-300/50 text-gray-800 shadow-lg";
    case "audio":
      return "bg-sky-300/50 text-gray-800 shadow-lg";
    case "file":
      return "bg-sky-300/50 text-gray-800 shadow-lg";
    case "mixed":
      return "bg-sky-300/50 text-gray-800 shadow-lg";
    default:
      return "bg-sky-300/50 text-gray-800 shadow-lg";
  }
}
