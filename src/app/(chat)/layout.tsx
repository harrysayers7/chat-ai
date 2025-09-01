"use client";

import { SidebarProvider as UISidebarProvider } from "@/components/ui/sidebar";
import { SWRConfigProvider } from "./swr-config";
import { HoverSidebar } from "@/components/layouts/hover-sidebar";
import { AppHeader } from "@/components/layouts/app-header";
import { AppPopupProvider } from "@/components/layouts/app-popup-provider";
import { RightSidebar } from "@/components/layouts/right-sidebar";
import { ContextMenu } from "@/components/layouts/context-menu";
import { SidebarProvider } from "@/contexts/sidebar-context";
import { useTextSelection } from "@/hooks/use-text-selection";
import { Suspense, useState, useEffect } from "react";
import { isShortcutEvent, Shortcuts } from "@/lib/keyboard-shortcuts";

export default function ChatLayout({
  children,
}: { children: React.ReactNode }) {
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const { selectedText } = useTextSelection();

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isShortcutEvent(e, Shortcuts.toggleRightSidebar)) {
        e.preventDefault();
        setIsRightSidebarOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <UISidebarProvider defaultOpen={false}>
      <SidebarProvider>
        <SWRConfigProvider>
          <AppPopupProvider />
          <HoverSidebar />
          <main className="relative bg-background w-full flex flex-col h-screen">
            <AppHeader />
            <div className="flex-1 overflow-y-auto">
              <Suspense fallback={<ChatLoadingFallback />}>{children}</Suspense>
            </div>
          </main>
          <RightSidebar
            isOpen={isRightSidebarOpen}
            onToggle={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
            selectedText={selectedText}
          />
          <ContextMenu />
        </SWRConfigProvider>
      </SidebarProvider>
    </UISidebarProvider>
  );
}

function ChatLoadingFallback() {
  return (
    <div className="flex flex-col h-full w-full max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    </div>
  );
}
