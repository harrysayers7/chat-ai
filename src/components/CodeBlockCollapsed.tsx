"use client";
import * as React from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function CodeBlockCollapsed({
  code,
  language = "text",
  filename,
  onCopy,
  onSaveToProject,
}: {
  code: string;
  language?: string;
  filename?: string;
  onCopy?: () => void;
  onSaveToProject?: () => void;
}) {
  const lines = React.useMemo(() => code.split("\n").length, [code]);

  const download = () => {
    const name = filename ?? `snippet.${extFor(language)}`;
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <Collapsible
      defaultOpen={false}
      className="rounded-lg overflow-hidden bg-muted/20 shadow-lg border border-border/30 hover:shadow-xl transition-all duration-300 mb-3"
    >
      <div className="flex items-center justify-between bg-gradient-to-r from-muted/50 to-muted/30 px-3 py-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Code type icon */}
          <div className="flex-shrink-0 w-6 h-6 rounded-md bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 flex items-center justify-center shadow-inner">
            <svg
              className="w-3 h-3 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
          </div>

          <div className="text-xs text-muted-foreground flex-shrink-0">
            <span className="font-medium">{language}</span> • {lines} lines
            {filename ? (
              <span className="ml-2 opacity-70">({filename})</span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {onSaveToProject && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSaveToProject}
              className="p-2 text-xs h-auto bg-background/60 hover:bg-background/80 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 rounded-md"
              title="Save to Project"
            >
              <Save className="w-3 h-3" />
            </Button>
          )}
          {onCopy && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCopy}
              className="p-2 text-xs h-auto bg-background/60 hover:bg-background/80 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 rounded-md"
              title="Copy code"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={download}
            className="p-2 text-xs h-auto bg-background/60 hover:bg-background/80 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 rounded-md"
            title="Download file"
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v13"
              />
            </svg>
          </Button>
          <CollapsibleTrigger
            data-collapsible="trigger"
            className="p-2 text-xs rounded-md hover:bg-background bg-background/60 hover:bg-background/80 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
            title="Toggle code block"
          >
            <svg
              className="w-3 h-3 transition-transform group-data-[state=open]:rotate-180"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </CollapsibleTrigger>
        </div>
      </div>

      <CollapsibleContent className="px-0">
        <div className="overflow-hidden">
          <SyntaxHighlighter
            style={oneDark}
            language={language}
            PreTag="div"
            customStyle={{
              margin: 0,
              padding: 0,
              borderRadius: 0,
              fontSize: "0.75rem",
              lineHeight: "1.5",
              border: "none",
              outline: "none",
            }}
            showLineNumbers={lines > 10}
            wrapLines={true}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function extFor(lang: string) {
  const map: Record<string, string> = {
    tsx: "tsx",
    ts: "ts",
    js: "js",
    jsx: "jsx",
    json: "json",
    css: "css",
    scss: "scss",
    html: "html",
    md: "md",
    py: "py",
    sh: "sh",
    go: "go",
    rs: "rs",
    java: "java",
    kt: "kt",
    c: "c",
    cpp: "cpp",
    yml: "yml",
    yaml: "yml",
    sql: "sql",
  };
  return map[lang] ?? "txt";
}
