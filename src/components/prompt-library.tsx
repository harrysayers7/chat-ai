"use client";

import { useState, useCallback } from "react";
import { PlusIcon, SearchIcon, BookOpenIcon } from "lucide-react";
import { Button } from "ui/button";
import { Input } from "ui/input";
import { Prompt, PromptCategory } from "@/types/prompt";
import { PromptEditor } from "./prompt-editor";
import { PromptItem } from "./prompt-item";

interface PromptLibraryProps {
  onInsertPrompt: (content: string) => void;
  embedded?: boolean;
  onCreatePrompt?: () => void;
}

export function PromptLibrary({
  onInsertPrompt,
  embedded = false,
  onCreatePrompt,
}: PromptLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

  // Mock data for now - will be replaced with real API calls
  const [prompts, setPrompts] = useState<Prompt[]>([
    {
      id: "1",
      name: "Code Review",
      content:
        "Please review this code for security issues, performance improvements, and best practices:",
      description: "Standard code review prompt",
      category: "Development",
      tags: ["code", "review", "security"],
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
      description: "Professional email assistance",
      category: "Communication",
      tags: ["email", "professional", "writing"],
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
      description: "Data analysis and insights",
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
    { id: "1", name: "Development", color: "#3b82f6", userId: "user1" },
    { id: "2", name: "Communication", color: "#10b981", userId: "user1" },
    { id: "3", name: "Analysis", color: "#f59e0b", userId: "user1" },
    { id: "4", name: "Writing", color: "#8b5cf6", userId: "user1" },
  ]);

  const filteredPrompts = prompts.filter((prompt) => {
    const matchesSearch =
      !searchQuery ||
      prompt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      !selectedCategory || prompt.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleCreatePrompt = useCallback(() => {
    setEditingPrompt(null);
    setIsEditorOpen(true);
  }, []);

  const handleEditPrompt = useCallback((prompt: Prompt) => {
    setEditingPrompt(prompt);
    setIsEditorOpen(true);
  }, []);

  const handleDeletePrompt = useCallback((promptId: string) => {
    setPrompts((prev) => prev.filter((p) => p.id !== promptId));
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

  return (
    <div className="flex flex-col h-full">
      {!embedded && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <BookOpenIcon className="w-5 h-5" />
              <h3 className="font-semibold">Prompt Library</h3>
            </div>
            <Button
              size="sm"
              onClick={onCreatePrompt || handleCreatePrompt}
              className="flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              New Prompt
            </Button>
          </div>
        </>
      )}

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
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredPrompts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery || selectedCategory
              ? "No prompts found"
              : "No prompts yet"}
          </div>
        ) : (
          filteredPrompts.map((prompt) => (
            <PromptItem
              key={prompt.id}
              prompt={prompt}
              onEdit={handleEditPrompt}
              onDelete={handleDeletePrompt}
              onInsert={handleInsertPrompt}
            />
          ))
        )}
      </div>

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
  );
}
