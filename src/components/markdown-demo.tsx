"use client";

import { Markdown } from "./markdown";

export function MarkdownDemo() {
  const sampleMarkdown = `# Welcome to Markdown & Syntax Highlighting!

This is a **bold text** and this is *italic text*.

## Code Examples

Here's some inline code: \`const greeting = "Hello World!"\`

### Python Code Block
\`\`\`python
def fibonacci(n):
    """Calculate the nth Fibonacci number."""
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# Test the function
result = fibonacci(10)
print(f"The 10th Fibonacci number is: {result}")
\`\`\`

### JavaScript Code Block
\`\`\`javascript
function greetUser(name) {
    const greeting = \`Hello, \${name}!\`;
    console.log(greeting);
    return greeting;
}

// Call the function
greetUser("Alice");
\`\`\`

### HTML Code Block
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Page</title>
</head>
<body>
    <h1>Welcome!</h1>
    <p>This is a paragraph with a <a href="#">link</a>.</p>
</body>
</html>
\`\`\`

## Lists

### Unordered List
- First item
- Second item
- Third item
  - Nested item
  - Another nested item

### Ordered List
1. First step
2. Second step
3. Third step

## Tables

| Language | Syntax | Description |
|----------|--------|-------------|
| Python | \`def\` | Function definition |
| JavaScript | \`function\` | Function declaration |
| HTML | \`<tag>\` | HTML element |

## Blockquotes

> This is a blockquote. It's great for highlighting important information or quotes.

## Links and Emphasis

Visit [GitHub](https://github.com) for more information.

You can also use ***bold and italic*** together, or ~~strikethrough~~ text.

---

*This demo shows the power of markdown formatting and syntax highlighting!*
`;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Markdown & Syntax Highlighting Demo
      </h1>
      <div className="bg-gray-800 rounded-lg p-6">
        <Markdown>{sampleMarkdown}</Markdown>
      </div>
    </div>
  );
}
