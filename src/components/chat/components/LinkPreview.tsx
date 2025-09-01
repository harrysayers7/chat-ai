"use client";

import React, { useState, useEffect, memo } from "react";
import {
  ExternalLink,
  Globe,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LinkMetadata {
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
  url: string;
  domain?: string;
}

interface LinkPreviewProps {
  url: string;
  children: React.ReactNode;
  className?: string;
}

export const LinkPreview = memo(function LinkPreview({
  url,
  children,
  className,
}: LinkPreviewProps) {
  const [metadata, setMetadata] = useState<LinkMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract domain from URL
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return url;
    }
  };

  // Fetch link metadata
  const fetchMetadata = async (url: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Try to fetch metadata from our API endpoint
      const response = await fetch(
        `/api/link-metadata?url=${encodeURIComponent(url)}`,
      );

      if (response.ok) {
        const data = await response.json();
        setMetadata(data);
      } else {
        // Fallback to basic metadata
        const domain = getDomain(url);
        const basicMetadata: LinkMetadata = {
          title: domain,
          description: `Link to ${domain}`,
          url,
          domain,
          favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
        };
        setMetadata(basicMetadata);
      }
    } catch (err) {
      // Fallback to basic metadata on error
      const domain = getDomain(url);
      const basicMetadata: LinkMetadata = {
        title: domain,
        description: `Link to ${domain}`,
        url,
        domain,
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
      };
      setMetadata(basicMetadata);
      console.error("Error fetching link metadata:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (url && !metadata) {
      fetchMetadata(url);
    }
  }, [url]);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  if (!metadata && !isLoading) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className={cn(
          "text-primary hover:underline flex gap-1.5 items-center transition-colors",
          className,
        )}
      >
        <ExternalLink className="w-3.5 h-3.5" />
        {children}
      </a>
    );
  }

  return (
    <div className="group">
      {/* Link text */}
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className={cn(
          "text-primary hover:underline flex gap-1.5 items-center transition-colors",
          className,
        )}
      >
        <ExternalLink className="w-3.5 h-3.5" />
        {children}
      </a>

      {/* Preview card */}
      <div className="mt-2">
        <button
          onClick={handleToggle}
          className="w-full text-left p-3 bg-background/40 border border-border/30 rounded-lg hover:bg-background/60 transition-all duration-200 group"
        >
          {isLoading ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-muted animate-pulse rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded" />
                <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
              </div>
            </div>
          ) : metadata ? (
            <div className="flex items-start gap-3">
              {/* Favicon */}
              {metadata.favicon && (
                <img
                  src={metadata.favicon}
                  alt=""
                  className="w-6 h-6 rounded flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-foreground truncate">
                    {metadata.title}
                  </span>
                  <Globe className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                </div>

                {metadata.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                    {metadata.description}
                  </p>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="truncate">{metadata.domain}</span>
                  {metadata.image && (
                    <div className="flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      <span>Has image</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Expand/collapse indicator */}
              <div className="text-muted-foreground transition-transform duration-200 group-hover:text-foreground">
                {isExpanded ? "−" : "+"}
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span>{error}</span>
            </div>
          ) : null}
        </button>

        {/* Expanded content */}
        {isExpanded && metadata && (
          <div className="mt-2 p-3 bg-background/20 border border-border/20 rounded-lg">
            {metadata.image && (
              <div className="mb-3">
                <img
                  src={metadata.image}
                  alt={metadata.title || "Preview image"}
                  className="w-full h-32 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            )}

            <div className="space-y-2">
              <div>
                <h4 className="text-sm font-medium text-foreground mb-1">
                  {metadata.title}
                </h4>
                {metadata.description && (
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {metadata.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{metadata.domain}</span>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  <span>Open link</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
