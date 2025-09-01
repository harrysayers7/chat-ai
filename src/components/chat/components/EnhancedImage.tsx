"use client";

import React, { useState, memo } from "react";
import {
  Image as ImageIcon,
  ZoomIn,
  Download,
  ExternalLink,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EnhancedImageProps {
  src: string;
  alt?: string;
  className?: string;
  width?: number | string;
  height?: number | string;
}

export const EnhancedImage = memo(function EnhancedImage({
  src,
  alt = "",
  className,
  width,
  height,
}: EnhancedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = alt || "image";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download image:", error);
    }
  };

  const openInNewTab = () => {
    window.open(src, "_blank");
  };

  if (hasError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center p-8 bg-muted/20 border border-dashed border-muted-foreground/30 rounded-lg",
          className,
        )}
      >
        <div className="text-center">
          <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Failed to load image</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Image container */}
      <div
        className={cn(
          "relative group overflow-hidden rounded-lg border border-border/30 bg-background/20",
          className,
        )}
      >
        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Image */}
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={cn(
            "w-full h-auto transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100",
          )}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />

        {/* Overlay with actions */}
        {imageLoaded && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex gap-2">
              <button
                onClick={() => setIsLightboxOpen(true)}
                className="p-2 bg-background/80 backdrop-blur-sm rounded-lg hover:bg-background/90 transition-colors"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleDownload}
                className="p-2 bg-background/80 backdrop-blur-sm rounded-lg hover:bg-background/90 transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={openInNewTab}
                className="p-2 bg-background/80 backdrop-blur-sm rounded-lg hover:bg-background/90 transition-colors"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Image info */}
        {alt && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <p className="text-white text-sm truncate">{alt}</p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <div className="relative max-w-[90vw] max-h-[90vh]">
            {/* Close button */}
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Image */}
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-full object-contain"
            />

            {/* Actions */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              <button
                onClick={handleDownload}
                className="p-2 bg-background/80 backdrop-blur-sm rounded-lg hover:bg-background/90 transition-colors text-white"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={openInNewTab}
                className="p-2 bg-background/80 backdrop-blur-sm rounded-lg hover:bg-background/90 transition-colors text-white"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>

            {/* Alt text */}
            {alt && (
              <div className="absolute top-4 left-4 right-4">
                <p className="text-white text-sm bg-black/50 backdrop-blur-sm rounded-lg p-2">
                  {alt}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
});
