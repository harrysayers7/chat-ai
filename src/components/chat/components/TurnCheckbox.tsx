"use client";

import React from "react";
import { Check, Square } from "lucide-react";

interface TurnCheckboxProps {
  isSelected: boolean;
  onToggle: () => void;
  className?: string;
}

export function TurnCheckbox({
  isSelected,
  onToggle,
  className = "",
}: TurnCheckboxProps) {
  return (
    <button
      onClick={onToggle}
      className={`w-4 h-4 rounded border-2 transition-all duration-200 flex items-center justify-center ${
        isSelected
          ? "bg-primary border-primary text-primary-foreground"
          : "bg-background/20 border-border/40 hover:border-border/60 hover:bg-background/30"
      } ${className}`}
    >
      {isSelected && <Check className="w-3 h-3" />}
    </button>
  );
}
