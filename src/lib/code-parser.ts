import { FileData } from "@/components/FilesTabs";

/**
 * Detects if a code block contains diff/patch content
 */
export function isDiffContent(code: string, language?: string): boolean {
  // Check language hints
  if (language && ["diff", "patch"].includes(language.toLowerCase())) {
    return true;
  }

  // Check content patterns
  const lines = code.split("\n");
  const hasDiffPatterns = lines.some(
    (line) =>
      line.startsWith("diff --git") ||
      line.startsWith("---") ||
      line.startsWith("+++") ||
      line.startsWith("@@") ||
      (line.startsWith("+") && !line.startsWith("++")) ||
      (line.startsWith("-") && !line.startsWith("--")),
  );

  return hasDiffPatterns;
}

/**
 * Parses markdown content to extract multiple files
 * Looks for patterns like:
 * - ```filename:language
 * - // file: filename
 * - # filename:
 */
export function parseMultiFileMarkdown(markdown: string): FileData[] {
  const files: FileData[] = [];

  // Pattern 1: ```filename:language
  const codeBlockPattern = /```(\w+[^:\n]*):(\w+)\n([\s\S]*?)```/g;
  let match;

  while ((match = codeBlockPattern.exec(markdown)) !== null) {
    const [, filename, language, code] = match;
    files.push({
      filename: filename.trim(),
      language: language.trim(),
      code: code.trim(),
    });
  }

  // Pattern 2: // file: filename or # filename:
  const _fileHeaderPattern =
    /(?:^|\n)(?:\/\/\s*file:\s*([^\n]+)|#\s*([^:\n]+):\s*([^\n]*))(?:\n|$)/g;
  let currentFile: Partial<FileData> | null = null;
  let currentCode: string[] = [];

  const lines = markdown.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for file header
    const headerMatch = line.match(
      /(?:\/\/\s*file:\s*([^\n]+)|#\s*([^:\n]+):\s*([^\n]*))/,
    );

    if (headerMatch) {
      // Save previous file if exists
      if (currentFile && currentFile.filename && currentCode.length > 0) {
        files.push({
          filename: currentFile.filename,
          language: currentFile.language || "text",
          code: currentCode.join("\n"),
        });
      }

      // Start new file
      const filename = headerMatch[1] || headerMatch[2];
      const language = headerMatch[3] || "text";
      currentFile = { filename: filename.trim(), language: language.trim() };
      currentCode = [];
    } else if (currentFile && currentFile.filename) {
      // Add line to current file
      currentCode.push(line);
    }
  }

  // Save last file
  if (currentFile && currentFile.filename && currentCode.length > 0) {
    files.push({
      filename: currentFile.filename,
      language: currentFile.language || "text",
      code: currentCode.join("\n"),
    });
  }

  return files;
}

/**
 * Determines if markdown content contains multiple files
 */
export function hasMultipleFiles(markdown: string): boolean {
  const files = parseMultiFileMarkdown(markdown);
  return files.length > 1;
}

/**
 * Extracts the first code block from markdown
 */
export function extractFirstCodeBlock(
  markdown: string,
): { code: string; language: string } | null {
  const codeBlockPattern = /```(\w+)?\n([\s\S]*?)```/;
  const match = markdown.match(codeBlockPattern);

  if (match) {
    return {
      language: match[1] || "text",
      code: match[2].trim(),
    };
  }

  return null;
}
