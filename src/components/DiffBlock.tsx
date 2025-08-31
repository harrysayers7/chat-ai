"use client";
import * as React from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function DiffBlock({
  diff,
  filename,
  onCopy,
}: {
  diff: string;
  filename?: string;
  onCopy?: () => void;
}) {
  const lines = React.useMemo(() => diff.split("\n").length, [diff]);

  // Generate preview for collapsed state (first 2-3 lines)
  const preview = React.useMemo(() => {
    const lines = diff.split("\n");
    const previewLines = lines.slice(0, 3);
    return previewLines.join("\n");
  }, [diff]);

  const download = () => {
    const name = filename ?? `diff.patch`;
    const blob = new Blob([diff], { type: "text/plain;charset=utf-8" });
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
      className="rounded-lg overflow-hidden bg-muted/20"
    >
      <div className="flex items-center justify-between bg-muted/40 px-3 py-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="text-xs text-muted-foreground flex-shrink-0">
            <span className="font-medium">diff</span> • {lines} lines
            {filename ? (
              <span className="ml-2 opacity-70">({filename})</span>
            ) : null}
          </div>

          {/* Preview snippet in header (collapsed state) */}
          <div
            className="hidden md:block max-w-[50vw] truncate font-mono text-[11px] opacity-70 ml-3"
            title={preview}
          >
            {preview.replace(/\n/g, " · ")}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {onCopy && (
            <button
              type="button"
              onClick={onCopy}
              className="px-2 py-1 text-xs border rounded-md hover:bg-background"
            >
              Copy
            </button>
          )}
          <button
            type="button"
            onClick={download}
            className="px-2 py-1 text-xs border rounded-md hover:bg-background"
            title="Download diff"
          >
            Download
          </button>
          <CollapsibleTrigger
            data-collapsible="trigger"
            className="px-2 py-1 text-xs border rounded-md hover:bg-background"
          >
            Toggle
          </CollapsibleTrigger>
        </div>
      </div>

      <CollapsibleContent className="px-0">
        <pre className="text-xs leading-6 p-3 overflow-auto">
          {diff.split("\n").map((line, i) => (
            <div
              key={i}
              className={
                line.startsWith("+")
                  ? "bg-green-50 dark:bg-green-950/20"
                  : line.startsWith("-")
                    ? "bg-red-50 dark:bg-red-950/20"
                    : line.startsWith("@@")
                      ? "bg-muted/40 font-semibold"
                      : line.startsWith("diff") ||
                          line.startsWith("index") ||
                          line.startsWith("---") ||
                          line.startsWith("+++")
                        ? "bg-muted/30"
                        : ""
              }
            >
              <code className="block px-2 py-0.5">{line}</code>
            </div>
          ))}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  );
}
