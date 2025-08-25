import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col h-full w-full max-w-3xl mx-auto px-6 py-8">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 mb-8">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-6 w-32" />
      </div>

      {/* Loading indicator */}
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading chat...</p>
        </div>
      </div>

      {/* Message skeletons */}
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Input skeleton */}
      <div className="mt-auto pt-8">
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </div>
  );
}
