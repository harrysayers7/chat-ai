import type { Turn } from "./types";

// Helper function to generate unique keys for turns
export function turnKey(t: Turn): string {
  const a = t.user?.id ?? "";
  const b = t.assistant?.id ?? "";
  return [a, b].filter(Boolean).join(":");
}

// Helper function to truncate text to first N words
export function truncateToWords(text: string, maxWords: number = 10): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "...";
}

// Helper function to format timestamp
export function formatTimestamp(): string {
  const now = new Date();
  return now.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// Convert messages to turns format
export function convertMessagesToTurns(messages: any[]): Turn[] {
  if (!messages || !Array.isArray(messages)) return [];

  const result: Turn[] = [];
  let currentTurn: Partial<Turn> = {};

  messages.forEach((msg, idx) => {
    if (msg.role === "user") {
      // If we have a previous turn, save it
      if (currentTurn.user || currentTurn.assistant) {
        result.push(currentTurn as Turn);
      }
      // Start new turn
      currentTurn = {
        user: {
          id: msg.id || `user-${idx}`,
          content: msg.content || "",
          isError: false,
        },
      };
    } else if (msg.role === "assistant") {
      currentTurn.assistant = {
        id: msg.id || `assistant-${idx}`,
        content: msg.content || "",
        isError: false,
        isLastMessage: idx === messages.length - 1,
        parts: msg.parts || [],
      };
      // Save the turn
      result.push(currentTurn as Turn);
      currentTurn = {};
    }
  });

  // Don't forget the last turn if it only has a user message
  if (currentTurn.user && !currentTurn.assistant) {
    result.push(currentTurn as Turn);
  }

  return result;
}

// Filter turns based on starred filter
export function filterTurns(
  turns: Turn[],
  starred: Record<string, boolean>,
  showOnlyStarred: boolean,
): Turn[] {
  if (!showOnlyStarred) return turns;

  // When showing only starred, include:
  // 1. All starred chats
  // 2. The last chat (always visible)
  return turns.filter((t, idx) => {
    const key = turnKey(t) || String(idx);
    const isLastChat = idx === turns.length - 1;
    const isStarred = !!starred[key];

    return isStarred || isLastChat;
  });
}
