"use client";

import { useState, useEffect, useCallback } from "react";

export interface TextSelection {
  text: string;
  startOffset: number;
  endOffset: number;
  element: Element | null;
}

export function useTextSelection() {
  const [selectedText, setSelectedText] = useState<string>("");
  const [selection, setSelection] = useState<TextSelection | null>(null);

  const handleSelection = useCallback(() => {
    const windowSelection = window.getSelection();

    if (!windowSelection || windowSelection.rangeCount === 0) {
      setSelectedText("");
      setSelection(null);
      return;
    }

    const text = windowSelection.toString().trim();

    if (!text) {
      setSelectedText("");
      setSelection(null);
      return;
    }

    const range = windowSelection.getRangeAt(0);
    const element = range.commonAncestorContainer.parentElement;

    setSelectedText(text);
    setSelection({
      text,
      startOffset: range.startOffset,
      endOffset: range.endOffset,
      element,
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedText("");
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  useEffect(() => {
    // Add event listeners for selection changes
    document.addEventListener("selectionchange", handleSelection);
    document.addEventListener("mouseup", handleSelection);
    document.addEventListener("keyup", handleSelection);

    return () => {
      document.removeEventListener("selectionchange", handleSelection);
      document.removeEventListener("mouseup", handleSelection);
      document.removeEventListener("keyup", handleSelection);
    };
  }, [handleSelection]);

  return {
    selectedText,
    selection,
    clearSelection,
  };
}
