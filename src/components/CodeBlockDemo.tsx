"use client";
import React from "react";
import CodeBlockCollapsed from "./CodeBlockCollapsed";
import DiffBlock from "./DiffBlock";
import FilesTabs from "./FilesTabs";
import { useSaveToProject } from "./ProjectTray";

export default function CodeBlockDemo() {
  const saveToProject = useSaveToProject();

  const sampleCode = `function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10));`;

  const sampleDiff = `diff --git a/src/components/Button.tsx b/src/components/Button.tsx
index 1234567..abcdefg 100644
--- a/src/components/Button.tsx
+++ b/src/components/Button.tsx
@@ -10,6 +10,7 @@ export function Button({
   variant = "default",
   size = "default",
   className,
+  disabled = false,
   ...props
 }: ButtonProps) {
   return (
@@ -20,6 +21,7 @@ export function Button({
       variant,
       size,
       className,
+      disabled,
       ...props
     />
   );
}`;

  const multiFileExample = [
    {
      filename: "package.json",
      language: "json",
      code: `{
  "name": "my-project",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.0.0",
    "typescript": "^5.0.0"
  }
}`,
    },
    {
      filename: "src/index.ts",
      language: "typescript",
      code: `import React from 'react';
import ReactDOM from 'react-dom';

function App() {
  return <h1>Hello World</h1>;
}

ReactDOM.render(<App />, document.getElementById('root'));`,
    },
    {
      filename: "README.md",
      language: "markdown",
      code: `# My Project

This is a sample project demonstrating the new code block features.

## Features
- Preview snippets
- Diff view mode
- Multi-file tabs
- Save to project`,
    },
  ];

  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">
          Code Block Enhancements Demo
        </h1>
        <p className="text-muted-foreground">
          Showcasing the new code block features including preview, diff view,
          multi-file tabs, and project saving.
        </p>
      </div>

      {/* Regular Code Block with Preview */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          1. Code Block with Preview
        </h2>
        <p className="text-sm text-muted-foreground mb-2">
          Notice the preview snippet in the header when collapsed (first 2-3
          lines)
        </p>
        <CodeBlockCollapsed
          code={sampleCode}
          language="typescript"
          filename="fibonacci.ts"
          onCopy={() => navigator.clipboard.writeText(sampleCode)}
          onSaveToProject={() =>
            saveToProject("fibonacci.ts", "typescript", sampleCode)
          }
        />
      </div>

      {/* Diff Block */}
      <div>
        <h2 className="text-xl font-semibold mb-4">2. Diff View Mode</h2>
        <p className="text-sm text-muted-foreground mb-2">
          Unified diff rendering with color-coded lines and collapsible header
        </p>
        <DiffBlock
          diff={sampleDiff}
          filename="Button.tsx.diff"
          onCopy={() => navigator.clipboard.writeText(sampleDiff)}
        />
      </div>

      {/* Multi-File Tabs */}
      <div>
        <h2 className="text-xl font-semibold mb-4">3. Multi-File Tabs</h2>
        <p className="text-sm text-muted-foreground mb-2">
          Multiple files grouped under tabs with individual code blocks
        </p>
        <FilesTabs
          files={multiFileExample}
          onCopy={(code) => navigator.clipboard.writeText(code)}
        />
      </div>

      {/* Instructions */}
      <div className="bg-muted/30 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">How to Use</h3>
        <ul className="space-y-2 text-sm">
          <li>
            • <strong>Preview:</strong> Hover over the preview text in collapsed
            headers to see full preview
          </li>
          <li>
            • <strong>Save to Project:</strong> Click the &quot;Save&quot;
            button in code blocks to add to your project
          </li>
          <li>
            • <strong>Project Tray:</strong> Click the floating
            &quot;Project&quot; button to view saved files
          </li>
          <li>
            • <strong>Diff View:</strong> Automatically detects diff content and
            renders with proper highlighting
          </li>
          <li>
            • <strong>Multi-File:</strong> Automatically groups multiple files
            under tabs when detected
          </li>
        </ul>
      </div>
    </div>
  );
}
