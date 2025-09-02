"use client";

import { useEffect, useRef } from "react";

export function useScrollbarAutoHide() {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;

      // Add scrolling class
      target.classList.add("scrolling");

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set timeout to remove scrolling class after scrolling stops
      timeoutRef.current = setTimeout(() => {
        target.classList.remove("scrolling");
      }, 1000); // Hide scrollbar after 1 second of no scrolling
    };

    // Add scroll listeners to all elements with scrollbar-auto-hide class
    const scrollElements = document.querySelectorAll(".scrollbar-auto-hide");

    scrollElements.forEach((element) => {
      element.addEventListener("scroll", handleScroll, { passive: true });
    });

    return () => {
      scrollElements.forEach((element) => {
        element.removeEventListener("scroll", handleScroll);
      });

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
}
