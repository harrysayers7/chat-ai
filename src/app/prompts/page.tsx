"use client";

import { PromptLibrary } from "@/components/prompt-library";
import { useRouter } from "next/navigation";

export default function PromptsPage() {
  const router = useRouter();

  const handleInsertPrompt = (content: string) => {
    // Navigate to chat with the prompt content
    // This will be enhanced to actually insert into the chat input
    router.push(`/?prompt=${encodeURIComponent(content)}`);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-80 border-r bg-background">
        <PromptLibrary onInsertPrompt={handleInsertPrompt} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <h2 className="text-2xl font-semibold mb-2">Prompt Library</h2>
          <p className="text-sm">
            Select a prompt from the sidebar to insert it into your chat
          </p>
        </div>
      </div>
    </div>
  );
}
