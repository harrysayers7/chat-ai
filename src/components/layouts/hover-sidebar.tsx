"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { Session, User } from "better-auth";
import { authClient } from "auth/client";
import useSWR from "swr";

interface HoverSidebarProps {
  session?: { session: Session; user: User } | undefined;
}

export function HoverSidebar({ session: propSession }: HoverSidebarProps) {
  // Get session from authClient if not provided as prop
  const { data: sessionData } = useSWR(
    "/session",
    () => authClient.getSession(),
    {
      fallbackData: propSession,
    },
  );

  const session = propSession || sessionData;
  const { open, setOpen, isMobile } = useSidebar();
  const [isHovering, setIsHovering] = useState(false);
  const [isHoverZoneActive, setIsHoverZoneActive] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // Don't apply hover behavior on mobile
  if (isMobile) {
    return <AppSidebar session={session} />;
  }

  const handleMouseEnter = () => {
    console.log("Sidebar mouse entered, current open state:", open);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    setIsHovering(true);
    // Open immediately when hovering over the sidebar
    if (!open) {
      console.log("Opening sidebar from mouse enter");
      setOpen(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);

    // Add a delay before hiding to prevent flickering
    hideTimeoutRef.current = setTimeout(() => {
      console.log("Hiding sidebar from mouse leave");
      setOpen(false);
    }, 500);
  };

  const handleHoverZoneEnter = () => {
    console.log("Hover zone entered, current open state:", open);
    setIsHoverZoneActive(true);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    // Quick response for hover zone
    hoverTimeoutRef.current = setTimeout(() => {
      console.log("Opening sidebar from hover zone");
      setOpen(true);
    }, 150);
  };

  const handleHoverZoneLeave = () => {
    console.log("Hover zone left");
    setIsHoverZoneActive(false);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    // Start hiding timer when leaving hover zone
    hideTimeoutRef.current = setTimeout(() => {
      if (!isHovering && !isHoverZoneActive) {
        console.log("Hiding sidebar from hover zone leave");
        setOpen(false);
      }
    }, 500);
  };

  return (
    <>
      {/* Hover zone on the left edge */}
      <div
        className="fixed left-0 top-0 z-50 w-8 h-screen bg-transparent hover:bg-primary/10 transition-colors duration-200 border-r border-transparent hover:border-primary/20"
        onMouseEnter={handleHoverZoneEnter}
        onMouseLeave={handleHoverZoneLeave}
        style={{ cursor: "pointer" }}
        title="Hover to expand sidebar"
      />

      {/* Render AppSidebar directly without wrapping div to preserve its positioning */}
      <AppSidebar
        session={session}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
    </>
  );
}
