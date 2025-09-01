"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  X,
  Plus,
  CheckSquare,
  FileText,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Star,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useSidebarContext,
  type SidebarItem,
} from "@/contexts/sidebar-context";

interface RightSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedText?: string;
  onAddFromSelection?: (item: Omit<SidebarItem, "id" | "createdAt">) => void;
}

export function RightSidebar({
  isOpen,
  onToggle,
  selectedText,
  onAddFromSelection,
}: RightSidebarProps) {
  const { items, addItem, updateItem, deleteItem } = useSidebarContext();
  const [activeTab, setActiveTab] = useState<"tasks" | "snippets" | "ideas">(
    "tasks",
  );
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemContent, setNewItemContent] = useState("");
  const [newItemType, setNewItemType] = useState<"task" | "snippet" | "idea">(
    "task",
  );
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  const handleAddItem = (item: Omit<SidebarItem, "id" | "createdAt">) => {
    addItem(item);
    setNewItemContent("");
    setIsAddingItem(false);
    // Auto-open sidebar when adding an item (but not if select is open)
    if (!isOpen && !isSelectOpen) {
      onToggle();
    }
  };

  const handleAddFromSelection = () => {
    if (selectedText) {
      handleAddItem({
        content: selectedText,
        type: newItemType,
        source: "chat selection",
      });
      // Open the sidebar when adding from selection
      if (!isOpen) {
        onToggle();
      }
    }
  };

  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
      });
    }
  };

  const openDropdown = () => {
    updateDropdownPosition();
    setIsSelectOpen(true);
  };

  const closeDropdown = () => {
    setIsSelectOpen(false);
  };

  const selectOption = (option: "task" | "snippet" | "idea") => {
    setNewItemType(option);
    setIsSelectOpen(false);
  };

  const filteredItems = items.filter((item) => {
    switch (activeTab) {
      case "tasks":
        return item.type === "task";
      case "snippets":
        return item.type === "snippet";
      case "ideas":
        return item.type === "idea";
      default:
        return false;
    }
  });

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case "tasks":
        return <CheckSquare className="h-4 w-4" />;
      case "snippets":
        return <FileText className="h-4 w-4" />;
      case "ideas":
        return <Lightbulb className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case "tasks":
        return "Tasks";
      case "snippets":
        return "Snippets";
      case "ideas":
        return "Ideas";
      default:
        return "";
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className={cn(
          "fixed right-4 top-1/2 -translate-y-1/2 z-30 transition-all duration-200",
          isOpen ? "right-96" : "right-4",
        )}
      >
        {isOpen ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-96 bg-background border-l border-border shadow-lg transition-transform duration-200 z-20",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold">Quick Notes</h2>
            <Button variant="ghost" size="sm" onClick={onToggle}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Tab Selector */}
          <div className="p-4 border-b border-border">
            <Select
              value={activeTab}
              onValueChange={(value: any) => setActiveTab(value)}
            >
              <SelectTrigger onClick={(e) => e.stopPropagation()}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tasks">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4" />
                    Tasks
                  </div>
                </SelectItem>
                <SelectItem value="snippets">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Snippets
                  </div>
                </SelectItem>
                <SelectItem value="ideas">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Ideas
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Add Item Section */}
          <div className="p-4 border-b border-border">
            {selectedText && selectedText.length > 10 && (
              <div
                className="mb-3 p-3 bg-muted rounded-lg"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <p className="text-sm text-muted-foreground mb-2">
                  Selected text:
                </p>
                <p className="text-sm italic">
                  &ldquo;{selectedText.slice(0, 100)}
                  {selectedText.length > 100 ? "..." : ""}&rdquo;
                </p>
                <div
                  className="flex gap-2 mt-2"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <div
                    className="relative"
                    onMouseEnter={() => {
                      if (!isSelectOpen) {
                        openDropdown();
                      }
                    }}
                    onMouseLeave={() => {
                      if (!isHovering) {
                        closeDropdown();
                      }
                    }}
                  >
                    <div
                      ref={buttonRef}
                      className="w-24 h-8 px-3 py-2 text-sm border border-input bg-background rounded-md flex items-center justify-between cursor-pointer hover:bg-accent"
                    >
                      <span>
                        {newItemType === "task"
                          ? "Task"
                          : newItemType === "snippet"
                            ? "Snippet"
                            : "Idea"}
                      </span>
                      <ChevronDown className="h-3 w-3" />
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddFromSelection();
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            )}

            {/* Quick Add from Clipboard */}
            <div className="mb-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    const clipboardText = await navigator.clipboard.readText();
                    if (clipboardText.trim()) {
                      handleAddItem({
                        content: clipboardText,
                        type: newItemType,
                        source: "clipboard",
                      });
                    }
                  } catch (error) {
                    console.error("Failed to read clipboard:", error);
                  }
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add from Clipboard
              </Button>
            </div>

            <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add {getTabLabel(activeTab).slice(0, -1)}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    Add {getTabLabel(activeTab).slice(0, -1)}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Select
                    value={newItemType}
                    onValueChange={(value: any) => setNewItemType(value)}
                  >
                    <SelectTrigger onClick={(e) => e.stopPropagation()}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="task">Task</SelectItem>
                      <SelectItem value="snippet">Snippet</SelectItem>
                      <SelectItem value="idea">Idea</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder={`Enter your ${newItemType}...`}
                    value={newItemContent}
                    onChange={(e) => setNewItemContent(e.target.value)}
                    rows={4}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddItem({
                          content: newItemContent,
                          type: newItemType,
                          source: "manual",
                        });
                      }}
                      disabled={!newItemContent.trim()}
                    >
                      Add
                    </Button>
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsAddingItem(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredItems.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <div className="mb-2">{getTabIcon(activeTab)}</div>
                <p>No {getTabLabel(activeTab).toLowerCase()} yet</p>
                <p className="text-xs">
                  Add your first{" "}
                  {getTabLabel(activeTab).slice(0, -1).toLowerCase()} above
                </p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "p-3 rounded-lg border transition-all duration-200 cursor-pointer",
                    item.isCompleted
                      ? "bg-muted opacity-75"
                      : "bg-background hover:bg-muted/50",
                  )}
                  onClick={() => {
                    // Auto-open sidebar when clicking on an item (but not if select is open)
                    if (!isOpen && !isSelectOpen) {
                      onToggle();
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {item.type === "task" && (
                        <div className="flex items-center gap-2 mb-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateItem(item.id, {
                                isCompleted: !item.isCompleted,
                              });
                            }}
                          >
                            <CheckSquare
                              className={cn(
                                "h-4 w-4",
                                item.isCompleted
                                  ? "text-green-500"
                                  : "text-muted-foreground",
                              )}
                            />
                          </Button>
                          {item.isCompleted && (
                            <Badge variant="secondary" className="text-xs">
                              Completed
                            </Badge>
                          )}
                        </div>
                      )}
                      <p
                        className={cn(
                          "text-sm",
                          item.isCompleted &&
                            "line-through text-muted-foreground",
                        )}
                      >
                        {item.content}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {item.createdAt.toLocaleDateString()}
                        </span>
                        {item.source && (
                          <Badge variant="outline" className="text-xs">
                            {item.source}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateItem(item.id, { isStarred: !item.isStarred });
                        }}
                      >
                        <Star
                          className={cn(
                            "h-3 w-3",
                            item.isStarred
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground",
                          )}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteItem(item.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Portal-based dropdown */}
      {isSelectOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed bg-background border border-border rounded-md shadow-lg z-[9999] w-24"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
            }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => {
              setIsHovering(false);
              closeDropdown();
            }}
          >
            <div
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted border-b border-border cursor-pointer"
              onMouseDown={() => selectOption("task")}
            >
              Task
            </div>
            <div
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted border-b border-border cursor-pointer"
              onMouseDown={() => selectOption("snippet")}
            >
              Snippet
            </div>
            <div
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted cursor-pointer"
              onMouseDown={() => selectOption("idea")}
            >
              Idea
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
