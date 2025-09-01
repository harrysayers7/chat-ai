"use client";

import React from "react";
import { Markdown } from "@/components/markdown";

export default function ContentTestPage() {
  const testContent = `
This is regular text that should not be styled.

TLDR: This is a summary that should be displayed in a grey box with a clipboard icon.

Important: This is an important note that should be displayed in a blue box with an info icon.

Warning: This is a warning message that should be displayed in an orange box with a warning icon.

Flagged: This is a flagged message that should be displayed in a red box with an alert icon.

Here's more regular text after the special content.
  `;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Content Box Test</h1>
        <div className="prose prose-gray max-w-none">
          <Markdown>{testContent}</Markdown>
        </div>
      </div>
    </div>
  );
}
