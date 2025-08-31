"use client";
import { useTheme } from "next-themes";
import { Fragment, useLayoutEffect, useRef, useState } from "react";
import type { JSX, ReactNode } from "react";
import { cn } from "lib/utils";
import Prism from "prismjs";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-python";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";
import "prismjs/components/prism-css";
import "prismjs/components/prism-scss";
import "prismjs/components/prism-html";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-java";
import "prismjs/components/prism-kotlin";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";

export function CodeBlockEnhanced({
  code,
  lang,
  fallback,
  className,
  showLineNumbers = true,
}: {
  code?: string;
  lang: string;
  fallback?: ReactNode;
  className?: string;
  showLineNumbers?: boolean;
}) {
  const { theme } = useTheme();
  const codeRef = useRef<HTMLElement>(null);
  const [isHighlighted, setIsHighlighted] = useState(false);

  useLayoutEffect(() => {
    if (codeRef.current && code && !isHighlighted) {
      // Set the language class for Prism
      codeRef.current.className = `language-${lang}`;

      // Highlight the code
      Prism.highlightElement(codeRef.current);
      setIsHighlighted(true);
    }
  }, [code, lang, isHighlighted]);

  // Re-highlight when theme changes
  useLayoutEffect(() => {
    if (codeRef.current && code && isHighlighted) {
      Prism.highlightElement(codeRef.current);
    }
  }, [theme, code, isHighlighted]);

  if (!code) return fallback;

  return (
    <pre
      lang={lang}
      className={cn("relative overflow-auto text-xs leading-6 p-3", className)}
    >
      <div className={cn(showLineNumbers && "pl-12 relative")}>
        {showLineNumbers && (
          <div className="absolute left-0 top-0 w-6 flex flex-col select-none text-right text-muted-foreground">
            {code.split("\n").map((_, index) => (
              <span key={index}>{index + 1}</span>
            ))}
          </div>
        )}
        <code ref={codeRef} className={`language-${lang}`}>
          {code}
        </code>
      </div>
    </pre>
  );
}
