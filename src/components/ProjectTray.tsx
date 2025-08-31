"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Trash2, FolderOpen, Download, X } from "lucide-react";
import CodeBlockCollapsed from "./CodeBlockCollapsed";

export interface SavedFile {
  id: string;
  filename: string;
  language: string;
  content: string;
  ts: number;
}

const STORAGE_KEY = "chat-ai:project";

export function useProjectStorage() {
  const [savedFiles, setSavedFiles] = React.useState<SavedFile[]>([]);

  // Load saved files from localStorage on mount and listen for new files
  React.useEffect(() => {
    const loadFiles = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setSavedFiles(Array.isArray(parsed) ? parsed : []);
        }
      } catch (error) {
        console.error("Failed to load project files:", error);
      }
    };

    // Load files initially
    loadFiles();

    // Listen for new files being added
    const handleFileAdded = () => {
      loadFiles();
    };

    window.addEventListener("project-file-added", handleFileAdded);

    return () => {
      window.removeEventListener("project-file-added", handleFileAdded);
    };
  }, []);

  // Save files to localStorage whenever they change
  const saveToStorage = React.useCallback((files: SavedFile[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
      setSavedFiles(files);
    } catch (error) {
      console.error("Failed to save project files:", error);
    }
  }, []);

  const addFile = React.useCallback(
    (file: Omit<SavedFile, "id" | "ts">) => {
      const newFile: SavedFile = {
        ...file,
        id: crypto.randomUUID(),
        ts: Date.now(),
      };
      const updated = [...savedFiles, newFile];
      saveToStorage(updated);
    },
    [savedFiles, saveToStorage],
  );

  const removeFile = React.useCallback(
    (id: string) => {
      const updated = savedFiles.filter((f) => f.id !== id);
      saveToStorage(updated);
    },
    [savedFiles, saveToStorage],
  );

  const clearAll = React.useCallback(() => {
    saveToStorage([]);
  }, [saveToStorage]);

  const downloadZip = React.useCallback(() => {
    // TODO: Implement ZIP download functionality
    alert("ZIP download coming soon!");
  }, []);

  return {
    savedFiles,
    addFile,
    removeFile,
    clearAll,
    downloadZip,
  };
}

export function ProjectTray() {
  const { savedFiles, removeFile, clearAll, downloadZip } = useProjectStorage();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      {/* Floating Project Button */}
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50 shadow-lg"
        onClick={() => setIsOpen(true)}
      >
        <FolderOpen className="w-4 h-4 mr-2" />
        Project ({savedFiles.length})
      </Button>

      {/* Project Drawer */}
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent>
          <DrawerHeader className="border-b">
            <DrawerTitle className="flex items-center justify-between">
              <span>Project Files</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </DrawerTitle>
          </DrawerHeader>

          <div className="p-4">
            {savedFiles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No files saved yet</p>
                <p className="text-sm">
                  Use the &quot;Save to Project&quot; button in code blocks to
                  save snippets
                </p>
              </div>
            ) : (
              <>
                {/* Action Buttons */}
                <div className="flex gap-2 mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadZip}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download ZIP
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAll}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                </div>

                {/* Files List */}
                <ScrollArea className="h-[60vh]">
                  <div className="space-y-4">
                    {savedFiles.map((file) => (
                      <div key={file.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">
                            {file.filename}
                            <span className="ml-2 text-xs text-muted-foreground">
                              {new Date(file.ts).toLocaleString()}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(file.id)}
                            className="text-destructive hover:text-destructive h-8 w-8 p-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <CodeBlockCollapsed
                          code={file.content}
                          language={file.language}
                          filename={file.filename}
                          onCopy={() =>
                            navigator.clipboard.writeText(file.content)
                          }
                        />

                        <Separator />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

// Hook for components to save files to project
export function useSaveToProject() {
  const { addFile } = useProjectStorage();

  return React.useCallback(
    (filename: string, language: string, content: string) => {
      addFile({ filename, language, content });
    },
    [addFile],
  );
}
