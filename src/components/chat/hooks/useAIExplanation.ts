import { useState, useCallback, useEffect } from "react";

interface UseAIExplanationReturn {
  isPopupVisible: boolean;
  popupPosition: { x: number; y: number };
  selectedText: string;
  showPopup: (text: string, x: number, y: number) => void;
  hidePopup: () => void;
  handleTextSelection: () => void;
}

export function useAIExplanation(): UseAIExplanationReturn {
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState("");

  const showPopup = useCallback((text: string, x: number, y: number) => {
    setSelectedText(text);
    setPopupPosition({ x, y });
    setIsPopupVisible(true);
  }, []);

  const hidePopup = useCallback(() => {
    setIsPopupVisible(false);
    setSelectedText("");
  }, []);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();

    if (!selection || selection.isCollapsed) {
      hidePopup();
      return;
    }

    const text = selection.toString().trim();

    if (text.length < 3) {
      hidePopup();
      return;
    }

    // Get selection coordinates
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Position popup near the selection
    const x = rect.left + rect.width / 2;
    const y = rect.bottom + 10;

    showPopup(text, x, y);
  }, [showPopup, hidePopup]);

  // Listen for text selection changes
  useEffect(() => {
    const handleSelectionChange = () => {
      // Small delay to ensure selection is complete
      setTimeout(handleTextSelection, 100);
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () =>
      document.removeEventListener("selectionchange", handleSelectionChange);
  }, [handleTextSelection]);

  // Hide popup on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        hidePopup();
      }
    };

    if (isPopupVisible) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isPopupVisible, hidePopup]);

  return {
    isPopupVisible,
    popupPosition,
    selectedText,
    showPopup,
    hidePopup,
    handleTextSelection,
  };
}
