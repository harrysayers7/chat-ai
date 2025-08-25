import { Button } from "@/components/ui/button";
import { FileQuestion, Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-3xl mx-auto px-6 py-8">
      <div className="flex flex-col items-center gap-6 text-center">
        {/* Not Found Icon */}
        <div className="flex items-center justify-center w-16 h-16 bg-muted rounded-full">
          <FileQuestion className="h-8 w-8 text-muted-foreground" />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Chat not found</h1>
          <p className="text-muted-foreground max-w-md">
            The chat you&apos;re looking for doesn&apos;t exist or may have been
            deleted. It&apos;s possible the chat was removed or you don&apos;t
            have access to it.
          </p>
        </div>

        {/* Action Button */}
        <Link href="/">
          <Button>
            <Home className="h-4 w-4 mr-2" />
            Go to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
