"use client";

import { useState } from "react";
import { EditIcon, TrashIcon, CopyIcon, MessageSquareIcon } from "lucide-react";
import { Button } from "ui/button";
import { Badge } from "ui/badge";
import { Prompt } from "@/types/prompt";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "ui/dialog";

interface PromptItemProps {
  prompt: Prompt;
  onEdit: (prompt: Prompt) => void;
  onDelete: (promptId: string) => void;
  onInsert: (content: string) => void;
}

export function PromptItem({
  prompt,
  onEdit,
  onDelete,
  onInsert,
}: PromptItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = () => {
    onInsert(prompt.content);
  };

  const handleDelete = () => {
    onDelete(prompt.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className="group relative p-4 border rounded-lg hover:border-primary/50 transition-colors">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{prompt.name}</h4>
            {prompt.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {prompt.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleInsert}
              className="h-8 w-8 p-0"
              title="Insert into chat"
            >
              <MessageSquareIcon className="w-4 h-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <EditIcon className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(prompt)}>
                  <EditIcon className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopy}>
                  <CopyIcon className="w-4 h-4 mr-2" />
                  {copied ? "Copied!" : "Copy"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive"
                >
                  <TrashIcon className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content Preview */}
        <div className="mb-3">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {prompt.content}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Category */}
            {prompt.category && (
              <Badge variant="secondary" className="text-xs">
                {prompt.category}
              </Badge>
            )}

            {/* Tags */}
            {prompt.tags && prompt.tags.length > 0 && (
              <div className="flex items-center gap-1">
                {prompt.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {prompt.tags.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{prompt.tags.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Usage Count */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MessageSquareIcon className="w-3 h-3" />
            {prompt.usageCount}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Prompt</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{prompt.name}&quot;? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
