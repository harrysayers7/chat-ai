"use client";

import React, { memo, PropsWithChildren } from "react";
import { cn } from "lib/utils";
import {
  ContentType,
  getContentColors,
  getContentIcon,
} from "lib/content-detector";

interface ContentBoxProps {
  type: ContentType;
  className?: string;
  children: React.ReactNode;
}

/**
 * ContentBox component that renders content in colored boxes
 * based on the content type and severity level
 */
export const ContentBox = memo(function ContentBox({
  type,
  className,
  children,
}: ContentBoxProps) {
  const colors = getContentColors(type);
  const icon = getContentIcon(type);

  return (
    <div
      className={cn(
        "rounded-lg border-2 p-4 my-4 transition-all duration-200",
        "shadow-sm hover:shadow-md",
        colors,
        className,
      )}
      style={{
        backgroundColor:
          type === "summary"
            ? "#f9fafb"
            : type === "important"
              ? "#eff6ff"
              : type === "warning"
                ? "#fffbeb"
                : type === "flagged"
                  ? "#fef2f2"
                  : "#f9fafb",
        borderColor:
          type === "summary"
            ? "#e5e7eb"
            : type === "important"
              ? "#93c5fd"
              : type === "warning"
                ? "#fed7aa"
                : type === "flagged"
                  ? "#fca5a5"
                  : "#e5e7eb",
        color:
          type === "summary"
            ? "#111827"
            : type === "important"
              ? "#1e40af"
              : type === "warning"
                ? "#92400e"
                : type === "flagged"
                  ? "#991b1b"
                  : "#111827",
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-lg leading-none mt-0.5">{icon}</div>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
});

ContentBox.displayName = "ContentBox";

/**
 * Specialized content box components for each type
 */
export const SummaryBox = memo(function SummaryBox({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ContentBox type="summary" className={className}>
      {children}
    </ContentBox>
  );
});

export const ImportantBox = memo(function ImportantBox({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ContentBox type="important" className={className}>
      {children}
    </ContentBox>
  );
});

export const WarningBox = memo(function WarningBox({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ContentBox type="warning" className={className}>
      {children}
    </ContentBox>
  );
});

export const FlaggedBox = memo(function FlaggedBox({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ContentBox type="flagged" className={className}>
      {children}
    </ContentBox>
  );
});

SummaryBox.displayName = "SummaryBox";
ImportantBox.displayName = "ImportantBox";
WarningBox.displayName = "WarningBox";
FlaggedBox.displayName = "FlaggedBox";
