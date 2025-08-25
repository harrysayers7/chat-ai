"use client";

import { useState, useCallback, useMemo } from "react";
import {
  PlusIcon,
  SearchIcon,
  BookOpenIcon,
  XIcon,
  CopyIcon,
  MessageSquareIcon,
  ChevronLeftIcon,
} from "lucide-react";
import { Button } from "ui/button";
import { Input } from "ui/input";
import { Badge } from "ui/badge";
import { Prompt, PromptCategory } from "@/types/prompt";
import { PromptEditor } from "./prompt-editor";

interface PromptLibrarySidePanelProps {
  onInsertPrompt: (content: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function PromptLibrarySidePanel({
  onInsertPrompt,
  onClose,
  isOpen,
}: PromptLibrarySidePanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);

  // Mock data for now - will be replaced with real API calls
  const [prompts, setPrompts] = useState<Prompt[]>([
    {
      id: "1",
      name: "Code Review",
      content:
        "Please review this code for security issues, performance improvements, and best practices:",
      description: "Standard code review prompt for development teams",
      category: "Development",
      tags: ["code", "review", "security", "performance"],
      isPublic: true,
      userId: "user1",
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 15,
    },
    {
      id: "2",
      name: "Email Writer",
      content: "Help me write a professional email about:",
      description: "Professional email assistance for business communication",
      category: "Communication",
      tags: ["email", "professional", "business"],
      isPublic: true,
      userId: "user1",
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 8,
    },
    {
      id: "3",
      name: "Data Analysis",
      content: "Analyze this data and provide insights on:",
      description: "Data analysis and insights generation",
      category: "Analysis",
      tags: ["data", "analysis", "insights"],
      isPublic: true,
      userId: "user1",
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 12,
    },
    {
      id: "4",
      name: "Creative Writing",
      content: "Help me write a creative story about:",
      description: "Creative writing assistance",
      category: "Writing",
      tags: ["creative", "writing", "story"],
      isPublic: true,
      userId: "user1",
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 6,
    },
  ]);

  const [categories] = useState<PromptCategory[]>([
    {
      id: "1",
      name: "Development",
      color: "#3b82f6",
      userId: "user1",
    },
    {
      id: "2",
      name: "Communication",
      color: "#10b981",
      userId: "user1",
    },
    {
      id: "3",
      name: "Analysis",
      color: "#f59e0b",
      userId: "user1",
    },
    {
      id: "4",
      name: "Writing",
      color: "#8b5cf6",
      userId: "user1",
    },
  ]);

  const filteredPrompts = useMemo(() => {
    return prompts.filter((prompt) => {
      const matchesSearch =
        prompt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        !selectedCategory || prompt.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [prompts, searchQuery, selectedCategory]);

  const handleCreatePrompt = useCallback(() => {
    setEditingPrompt(null);
    setIsEditorOpen(true);
  }, []);

  const handleEditPrompt = useCallback((prompt: Prompt) => {
    setEditingPrompt(prompt);
    setIsEditorOpen(true);
  }, []);

  const handleSavePrompt = useCallback(
    (
      prompt: Omit<
        Prompt,
        "id" | "userId" | "createdAt" | "updatedAt" | "usageCount"
      >,
    ) => {
      if (editingPrompt) {
        // Update existing prompt
        setPrompts((prev) =>
          prev.map((p) =>
            p.id === editingPrompt.id
              ? { ...p, ...prompt, updatedAt: new Date() }
              : p,
          ),
        );
      } else {
        // Create new prompt
        const newPrompt: Prompt = {
          ...prompt,
          id: Date.now().toString(),
          userId: "user1", // Will come from auth context
          createdAt: new Date(),
          updatedAt: new Date(),
          usageCount: 0,
        };
        setPrompts((prev) => [newPrompt, ...prev]);
      }
      setIsEditorOpen(false);
      setEditingPrompt(null);
    },
    [editingPrompt],
  );

  const handleInsertPrompt = useCallback(
    (content: string) => {
      onInsertPrompt(content);
      // Increment usage count
      // This will be handled by the API in the real implementation
    },
    [onInsertPrompt],
  );

  const handleCopyPrompt = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // You could add a toast notification here
    } catch (err) {
      console.error("Failed to copy prompt:", err);
    }
  }, []);

  const handlePromptSelect = useCallback((prompt: Prompt) => {
    setSelectedPrompt(prompt);
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedPrompt(null);
  }, []);

  // Group prompts by category for better organization
  const promptsByCategory = useMemo(() => {
    const grouped: Record<string, Prompt[]> = {};
    filteredPrompts.forEach((prompt) => {
      const category = prompt.category || "Uncategorized";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(prompt);
    });
    return grouped;
  }, [filteredPrompts]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Side Panel */}
      <div className="fixed right-0 top-0 h-full w-96 bg-background border-l shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <BookOpenIcon className="w-5 h-5" />
            <h3 className="font-semibold">Prompt Library</h3>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <XIcon className="w-4 h-4" />
          </Button>
        </div>

        {selectedPrompt ? (
          // Prompt Detail View
          <div className="flex-1 flex flex-col">
            {/* Back Button */}
            <div className="p-4 border-b">
              <Button
                variant="ghost"
                onClick={handleBackToList}
                className="flex items-center gap-2"
              >
                <ChevronLeftIcon className="w-4 h-4" />
                Back to Library
              </Button>
            </div>

            {/* Prompt Content */}
            <div className="flex-1 p-4 space-y-4">
              <div>
                <h4 className="font-semibold text-lg mb-2">
                  {selectedPrompt.name}
                </h4>
                {selectedPrompt.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {selectedPrompt.description}
                  </p>
                )}
                {selectedPrompt.category && (
                  <Badge variant="secondary" className="mb-3">
                    {selectedPrompt.category}
                  </Badge>
                )}
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm whitespace-pre-wrap">
                  {selectedPrompt.content}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={() => handleInsertPrompt(selectedPrompt.content)}
                  className="flex-1"
                >
                  <MessageSquareIcon className="w-4 h-4 mr-2" />
                  Insert into Chat
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleCopyPrompt(selectedPrompt.content)}
                >
                  <CopyIcon className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>

              {/* Metadata */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                <span>Used {selectedPrompt.usageCount} times</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditPrompt(selectedPrompt)}
                >
                  Edit
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Prompt List View
          <>
            {/* Search and Filters */}
            <div className="p-4 space-y-3 border-b">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search prompts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === "" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("")}
                >
                  All
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={
                      selectedCategory === category.name ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedCategory(category.name)}
                    className="flex items-center gap-2"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Prompts List */}
            <div className="flex-1 overflow-y-auto">
              {Object.entries(promptsByCategory).map(
                ([category, categoryPrompts]) => (
                  <div key={category} className="p-4">
                    <h4 className="font-medium text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                      {category}
                    </h4>
                    <div className="space-y-2">
                      {categoryPrompts.map((prompt) => (
                        <div
                          key={prompt.id}
                          className="p-3 rounded-lg border hover:border-primary/50 transition-colors cursor-pointer group"
                          onClick={() => handlePromptSelect(prompt)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-sm truncate">
                                {prompt.name}
                              </h5>
                              {prompt.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                  {prompt.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-xs text-muted-foreground">
                                {prompt.usageCount}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ),
              )}

              {filteredPrompts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery || selectedCategory
                    ? "No prompts found"
                    : "No prompts yet"}
                </div>
              )}
            </div>

            {/* New Prompt Button */}
            <div className="p-4 border-t">
              <Button onClick={handleCreatePrompt} className="w-full">
                <PlusIcon className="w-4 h-4 mr-2" />
                New Prompt
              </Button>
            </div>
          </>
        )}

        {/* Prompt Editor Modal */}
        {isEditorOpen && (
          <PromptEditor
            prompt={editingPrompt}
            categories={categories}
            onSave={handleSavePrompt}
            onClose={() => {
              setIsEditorOpen(false);
              setEditingPrompt(null);
            }}
          />
        )}
      </div>
    </>
  );
}
