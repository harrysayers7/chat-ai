"use client";
import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CodeBlockCollapsed from "./CodeBlockCollapsed";

export interface FileData {
  filename: string;
  language: string;
  code: string;
}

interface FilesTabsProps {
  files: FileData[];
  onCopy?: (code: string) => void;
}

export default function FilesTabs({ files, onCopy }: FilesTabsProps) {
  if (!files || files.length === 0) return null;

  // Default to first file if available
  const defaultFile = files[0]?.filename || "";

  return (
    <div className="rounded-lg overflow-hidden bg-muted/20">
      <Tabs defaultValue={defaultFile} className="w-full">
        <TabsList className="flex flex-wrap gap-1 p-2 bg-muted/40 rounded-none border-b">
          {files.map((file) => (
            <TabsTrigger
              key={file.filename}
              value={file.filename}
              className="text-xs data-[state=active]:bg-background"
            >
              {file.filename}
            </TabsTrigger>
          ))}
        </TabsList>

        {files.map((file) => (
          <TabsContent
            key={file.filename}
            value={file.filename}
            className="m-0"
          >
            <CodeBlockCollapsed
              code={file.code}
              language={file.language}
              filename={file.filename}
              onCopy={onCopy ? () => onCopy(file.code) : undefined}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
