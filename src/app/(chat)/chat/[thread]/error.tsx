"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to console for debugging
    console.error("Chat loading error:", error);
  }, [error]);

  const handleGoHome = () => {
    router.push("/");
  };

  const handleRetry = () => {
    reset();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-3xl mx-auto px-6 py-8">
      <div className="flex flex-col items-center gap-6 text-center">
        {/* Error Icon */}
        <div className="flex items-center justify-center w-16 h-16 bg-destructive/10 rounded-full">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>

        {/* Error Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Failed to load chat</h1>
          <p className="text-muted-foreground max-w-md">
            We encountered an error while loading this chat. This might be due
            to a network issue or the chat may have been deleted.
          </p>
        </div>

        {/* Error Details (for debugging) */}
        {process.env.NODE_ENV === "development" && (
          <details className="w-full max-w-md">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              Error details (development only)
            </summary>
            <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto text-left">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button onClick={handleRetry} variant="default">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button onClick={handleGoHome} variant="outline">
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}
