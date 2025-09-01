"use client";

import { useSidebarContext } from "@/contexts/sidebar-context";
import { useMemo } from "react";

export function useSidebarContextForAI() {
  const { items } = useSidebarContext();

  const sidebarContext = useMemo(() => {
    if (items.length === 0) {
      return "";
    }

    const tasks = items.filter(
      (item) => item.type === "task" && !item.isCompleted,
    );
    const snippets = items.filter((item) => item.type === "snippet");
    const ideas = items.filter((item) => item.type === "idea");
    const starredItems = items.filter((item) => item.isStarred);

    let context = "## Your Personal Notes & Tasks\n\n";

    if (starredItems.length > 0) {
      context += "### ⭐ Starred Items (High Priority)\n";
      starredItems.forEach((item) => {
        const type =
          item.type === "task"
            ? "📋 Task"
            : item.type === "snippet"
              ? "📄 Snippet"
              : "💡 Idea";
        context += `- ${type}: ${item.content}\n`;
      });
      context += "\n";
    }

    if (tasks.length > 0) {
      context += "### 📋 Active Tasks\n";
      tasks.forEach((task) => {
        context += `- ${task.content}\n`;
      });
      context += "\n";
    }

    if (snippets.length > 0) {
      context += "### 📄 Saved Snippets\n";
      snippets.slice(0, 5).forEach((snippet) => {
        // Limit to 5 most recent
        context += `- ${snippet.content.slice(0, 100)}${snippet.content.length > 100 ? "..." : ""}\n`;
      });
      if (snippets.length > 5) {
        context += `- ... and ${snippets.length - 5} more snippets\n`;
      }
      context += "\n";
    }

    if (ideas.length > 0) {
      context += "### 💡 Ideas & Notes\n";
      ideas.slice(0, 5).forEach((idea) => {
        // Limit to 5 most recent
        context += `- ${idea.content.slice(0, 100)}${idea.content.length > 100 ? "..." : ""}\n`;
      });
      if (ideas.length > 5) {
        context += `- ... and ${ideas.length - 5} more ideas\n`;
      }
      context += "\n";
    }

    context +=
      "You can reference these items in your responses and help the user work with their tasks, snippets, and ideas. ";
    context +=
      "If relevant, suggest how to work on tasks or expand on ideas.\n\n";

    return context;
  }, [items]);

  return sidebarContext;
}
