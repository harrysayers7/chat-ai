"use client";

import { SidebarProvider } from "ui/sidebar";
import { SWRConfigProvider } from "./swr-config";
import { AppSidebar } from "@/components/layouts/app-sidebar";
import { AppHeader } from "@/components/layouts/app-header";
import { AppPopupProvider } from "@/components/layouts/app-popup-provider";
import { Suspense } from "react";

export default function ChatLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <SWRConfigProvider>
        <AppPopupProvider />
        <AppSidebar />
        <main className="relative bg-background w-full flex flex-col h-screen">
          <AppHeader />
          <div className="flex-1 overflow-y-auto">
            <Suspense fallback={<ChatLoadingFallback />}>{children}</Suspense>
          </div>
        </main>
      </SWRConfigProvider>
    </SidebarProvider>
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
