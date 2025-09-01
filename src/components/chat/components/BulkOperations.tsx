"use client";

import React, { useState, useCallback } from "react";
import { Pin, Star, Trash2, X, Check, Square } from "lucide-react";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";

interface BulkOperationsProps {
  selectedTurns: string[];
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkPin: () => void;
  onBulkStar: () => void;
  onBulkDelete: () => void;
  totalTurns: number;
}

export function BulkOperations({
  selectedTurns,
  onSelectAll,
  onDeselectAll,
  onBulkPin,
  onBulkStar,
  onBulkDelete,
  totalTurns,
}: BulkOperationsProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Show toolbar when items are selected
  React.useEffect(() => {
    setIsVisible(selectedTurns.length > 0);
  }, [selectedTurns.length]);

  const handleSelectAll = useCallback(() => {
    if (selectedTurns.length === totalTurns) {
      onDeselectAll();
    } else {
      onSelectAll();
    }
  }, [selectedTurns.length, totalTurns, onSelectAll, onDeselectAll]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-background/95 backdrop-blur-lg border border-border/30 rounded-2xl shadow-lg p-3">
        <div className="flex items-center gap-3">
          {/* Selection Info */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {selectedTurns.length} selected
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="text-xs h-6 px-2"
            >
              {selectedTurns.length === totalTurns
                ? "Deselect all"
                : "Select all"}
            </Button>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-border/30" />

          {/* Bulk Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkPin}
              className="h-8 px-3 text-xs"
            >
              <Pin className="w-3 h-3 mr-1" />
              Pin All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkStar}
              className="h-8 px-3 text-xs"
            >
              <Star className="w-3 h-3 mr-1" />
              Star All
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onBulkDelete}
              className="h-8 px-3 text-xs"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Delete All
            </Button>
          </div>

          {/* Close */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onDeselectAll}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
