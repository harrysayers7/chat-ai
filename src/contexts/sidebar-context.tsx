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

export type NotionTask = {
  id: string;
  title: string;
  status: "Not Started" | "In Progress" | "Done" | "Blocked";
  priority: "Low" | "Medium" | "High" | "Urgent";
  assignee?: string;
  due_date?: string;
  description?: string;
  database_id: string;
  created_at: string;
  updated_at?: string;
};

export type NotionDatabase = {
  id: string;
  title: string;
  description?: string;
  type: "database";
};

export type SyncAction = {
  id: string;
  type: "promote_to_notion" | "import_from_notion" | "sync_with_notion";
  localItemId?: string;
  notionTaskId?: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  createdAt: Date;
  error?: string;
};

interface SidebarContextType {
  items: SidebarItem[];
  addItem: (item: Omit<SidebarItem, "id" | "createdAt">) => void;
  updateItem: (id: string, updates: Partial<SidebarItem>) => void;
  deleteItem: (id: string) => void;
  // Notion-related state and actions
  notionTasks: NotionTask[];
  notionDatabases: NotionDatabase[];
  selectedDatabaseId: string | null;
  syncActions: SyncAction[];
  // Notion actions
  setNotionTasks: (tasks: NotionTask[]) => void;
  setNotionDatabases: (databases: NotionDatabase[]) => void;
  setSelectedDatabaseId: (id: string | null) => void;
  addSyncAction: (action: Omit<SyncAction, "id" | "createdAt">) => void;
  updateSyncAction: (id: string, updates: Partial<SyncAction>) => void;
  promoteToNotion: (itemId: string, databaseId: string) => Promise<void>;
  importFromNotion: (taskId: string) => Promise<void>;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<SidebarItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Notion-related state
  const [notionTasks, setNotionTasks] = useState<NotionTask[]>([]);
  const [notionDatabases, setNotionDatabases] = useState<NotionDatabase[]>([]);
  const [selectedDatabaseId, setSelectedDatabaseId] = useState<string | null>(
    null,
  );
  const [syncActions, setSyncActions] = useState<SyncAction[]>([]);

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

  // Load Notion-related data from localStorage
  useEffect(() => {
    const savedNotionTasks = localStorage.getItem("notion-tasks");
    const savedNotionDatabases = localStorage.getItem("notion-databases");
    const savedSelectedDatabaseId = localStorage.getItem(
      "selected-database-id",
    );
    const savedSyncActions = localStorage.getItem("sync-actions");

    if (savedNotionTasks) {
      try {
        setNotionTasks(JSON.parse(savedNotionTasks));
      } catch (error) {
        console.error("Failed to load Notion tasks:", error);
      }
    }

    if (savedNotionDatabases) {
      try {
        setNotionDatabases(JSON.parse(savedNotionDatabases));
      } catch (error) {
        console.error("Failed to load Notion databases:", error);
      }
    }

    if (savedSelectedDatabaseId) {
      setSelectedDatabaseId(savedSelectedDatabaseId);
    }

    if (savedSyncActions) {
      try {
        const parsed = JSON.parse(savedSyncActions);
        setSyncActions(
          parsed.map((action: any) => ({
            ...action,
            createdAt: new Date(action.createdAt),
          })),
        );
      } catch (error) {
        console.error("Failed to load sync actions:", error);
      }
    }
  }, []);

  // Save Notion-related data to localStorage
  useEffect(() => {
    localStorage.setItem("notion-tasks", JSON.stringify(notionTasks));
  }, [notionTasks]);

  useEffect(() => {
    localStorage.setItem("notion-databases", JSON.stringify(notionDatabases));
  }, [notionDatabases]);

  useEffect(() => {
    if (selectedDatabaseId) {
      localStorage.setItem("selected-database-id", selectedDatabaseId);
    } else {
      localStorage.removeItem("selected-database-id");
    }
  }, [selectedDatabaseId]);

  useEffect(() => {
    localStorage.setItem("sync-actions", JSON.stringify(syncActions));
  }, [syncActions]);

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

  // Notion-related functions
  const addSyncAction = (action: Omit<SyncAction, "id" | "createdAt">) => {
    const newAction: SyncAction = {
      ...action,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setSyncActions((prev) => [newAction, ...prev]);
  };

  const updateSyncAction = (id: string, updates: Partial<SyncAction>) => {
    setSyncActions((prev) =>
      prev.map((action) =>
        action.id === id ? { ...action, ...updates } : action,
      ),
    );
  };

  const promoteToNotion = async (itemId: string, databaseId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const syncActionId = Date.now().toString();
    addSyncAction({
      type: "promote_to_notion",
      localItemId: itemId,
      status: "in_progress",
    });

    try {
      // Import the MCP action dynamically to avoid circular dependencies
      const { callMcpToolAction } = await import("@/app/api/mcp/actions");

      // For now, we'll need to find the server ID dynamically
      // This is a simplified approach - in a real implementation, you'd pass the server ID
      const result = await callMcpToolAction("notion-tasks", "create_task", {
        database_id: databaseId,
        title: item.content,
        status: item.isCompleted ? "Done" : "Not Started",
        priority: "Medium",
        description: item.source ? `Imported from: ${item.source}` : undefined,
      });

      if (result?.content && Array.isArray(result.content)) {
        const taskText = result.content.find((c) => c.type === "text")?.text;
        if (taskText) {
          try {
            const newTask = JSON.parse(taskText);
            if (newTask.id) {
              setNotionTasks((prev) => [newTask, ...prev]);
              updateSyncAction(syncActionId, {
                status: "completed",
                notionTaskId: newTask.id,
              });
            }
          } catch (_parseError) {
            throw new Error("Failed to parse created task");
          }
        }
      }
    } catch (error) {
      updateSyncAction(syncActionId, {
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const importFromNotion = async (taskId: string) => {
    const task = notionTasks.find((t) => t.id === taskId);
    if (!task) return;

    const syncActionId = Date.now().toString();
    addSyncAction({
      type: "import_from_notion",
      notionTaskId: taskId,
      status: "in_progress",
    });

    try {
      // Convert Notion task to local item
      const localItem: Omit<SidebarItem, "id" | "createdAt"> = {
        content: task.title,
        type: "task",
        isCompleted: task.status === "Done",
        source: "notion",
      };
      addItem(localItem);
      updateSyncAction(syncActionId, { status: "completed" });
    } catch (error) {
      updateSyncAction(syncActionId, {
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  return (
    <SidebarContext.Provider
      value={{
        items,
        addItem,
        updateItem,
        deleteItem,
        notionTasks,
        notionDatabases,
        selectedDatabaseId,
        syncActions,
        setNotionTasks,
        setNotionDatabases,
        setSelectedDatabaseId,
        addSyncAction,
        updateSyncAction,
        promoteToNotion,
        importFromNotion,
      }}
    >
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
