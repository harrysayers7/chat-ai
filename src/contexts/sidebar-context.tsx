"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export type SidebarItem = {
  id: string;
  content: string;
  type: "task" | "snippet" | "idea";
  createdAt: Date;
  isCompleted?: boolean;
  isStarred?: boolean;
  source?: string;
};

interface SidebarContextType {
  items: SidebarItem[];
  addItem: (item: Omit<SidebarItem, "id" | "createdAt">) => void;
  updateItem: (id: string, updates: Partial<SidebarItem>) => void;
  deleteItem: (id: string) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<SidebarItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load items from localStorage on mount
  useEffect(() => {
    const savedItems = localStorage.getItem("right-sidebar-items");
    if (savedItems) {
      try {
        const parsed = JSON.parse(savedItems);
        setItems(
          parsed.map((item: any) => ({
            ...item,
            createdAt: new Date(item.createdAt),
          })),
        );
      } catch (error) {
        console.error("Failed to load sidebar items:", error);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save items to localStorage whenever items change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("right-sidebar-items", JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const addItem = (item: Omit<SidebarItem, "id" | "createdAt">) => {
    const newItem: SidebarItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setItems((prev) => [newItem, ...prev]);
  };

  const updateItem = (id: string, updates: Partial<SidebarItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <SidebarContext.Provider value={{ items, addItem, updateItem, deleteItem }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebarContext must be used within a SidebarProvider");
  }
  return context;
}
