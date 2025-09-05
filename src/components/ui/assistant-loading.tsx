import { cn } from "@/lib/utils";

interface AssistantLoadingProps {
  className?: string;
  message?: string;
}

export function AssistantLoading({
  className,
  message = "Assistant is thinking...",
}: AssistantLoadingProps) {
  return (
    <div className={cn("flex items-center justify-center py-6", className)}>
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <div
            className="w-2 h-2 bg-primary rounded-full animate-pulse"
            style={{ animationDelay: "0.2s" }}
          />
          <div
            className="w-2 h-2 bg-primary rounded-full animate-pulse"
            style={{ animationDelay: "0.4s" }}
          />
        </div>
        <span className="text-sm text-muted-foreground">{message}</span>
      </div>
    </div>
  );
}
