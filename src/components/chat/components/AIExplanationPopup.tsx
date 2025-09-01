"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, X, Copy, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AIExplanationPopupProps {
  isVisible: boolean;
  position: { x: number; y: number };
  selectedText: string;
  onClose: () => void;
  onExplain: (text: string) => Promise<string>;
}

export function AIExplanationPopup({
  isVisible,
  position,
  selectedText,
  onClose,
  onExplain,
}: AIExplanationPopupProps) {
  const [explanation, setExplanation] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Auto-generate explanation when popup becomes visible
  useEffect(() => {
    if (isVisible && selectedText.trim()) {
      generateExplanation();
    }
  }, [isVisible, selectedText]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isVisible, onClose]);

  const generateExplanation = useCallback(async () => {
    if (!selectedText.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await onExplain(selectedText);
      setExplanation(result);
    } catch (err) {
      setError("Failed to generate explanation. Please try again.");
      console.error("AI explanation error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedText, onExplain]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(explanation);
      toast.success("Explanation copied to clipboard");
    } catch (_err) {
      toast.error("Failed to copy explanation");
    }
  };

  const handleRegenerate = () => {
    setExplanation("");
    generateExplanation();
  };

  if (!isVisible) return null;

  return (
    <div
      ref={popupRef}
      className="fixed z-50 bg-background/95 backdrop-blur-lg border border-border/50 rounded-lg shadow-xl max-w-md"
      style={{
        left: Math.min(position.x, window.innerWidth - 400),
        top: Math.min(position.y, window.innerHeight - 300),
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">AI Explanation</span>
          <Badge variant="secondary" className="text-xs">
            {selectedText.length > 50 ? "Long text" : "Short text"}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-3">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating explanation...
          </div>
        ) : error ? (
          <div className="space-y-2">
            <p className="text-sm text-destructive">{error}</p>
            <Button size="sm" onClick={handleRegenerate}>
              Try Again
            </Button>
          </div>
        ) : explanation ? (
          <div className="space-y-3">
            <div className="text-sm leading-relaxed">{explanation}</div>
            <div className="flex items-center gap-2 pt-2 border-t border-border/30">
              <Button size="sm" variant="outline" onClick={handleCopy}>
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </Button>
              <Button size="sm" variant="outline" onClick={handleRegenerate}>
                <Sparkles className="w-3 h-3 mr-1" />
                Regenerate
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
