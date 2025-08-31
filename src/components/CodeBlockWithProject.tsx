"use client";
import React from "react";
import CodeBlockCollapsed from "./CodeBlockCollapsed";
import { useSaveToProject } from "./ProjectTray";

interface CodeBlockWithProjectProps {
  code: string;
  language: string;
  onCopy?: () => void;
}

export default function CodeBlockWithProject({
  code,
  language,
  onCopy,
}: CodeBlockWithProjectProps) {
  const saveToProject = useSaveToProject();

  const handleSaveToProject = () => {
    const filename = `${language === "text" ? "snippet" : `snippet.${language}`}`;
    saveToProject(filename, language, code);
  };

  return (
    <CodeBlockCollapsed
      code={code}
      language={language}
      onCopy={onCopy}
      onSaveToProject={handleSaveToProject}
    />
  );
}
