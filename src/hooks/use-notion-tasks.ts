"use client";

import { useState, useCallback, useEffect } from "react";
import { NotionTask, NotionDatabase } from "@/contexts/sidebar-context";
import { callMcpToolAction } from "@/app/api/mcp/actions";
import useSWR from "swr";

interface UseNotionTasksReturn {
  tasks: NotionTask[];
  databases: NotionDatabase[];
  isLoading: boolean;
  error: string | null;
  notionServerId: string | null;
  fetchTasks: (databaseId: string, filter?: any) => Promise<void>;
  createTask: (
    databaseId: string,
    task: Omit<NotionTask, "id" | "created_at">,
  ) => Promise<NotionTask | null>;
  updateTask: (taskId: string, updates: Partial<NotionTask>) => Promise<void>;
  fetchDatabases: () => Promise<void>;
  refreshTasks: () => Promise<void>;
}

export function useNotionTasks(): UseNotionTasksReturn {
  const [tasks, setTasks] = useState<NotionTask[]>([]);
  const [databases, setDatabases] = useState<NotionDatabase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDatabaseId, setCurrentDatabaseId] = useState<string | null>(
    null,
  );
  const [notionServerId, setNotionServerId] = useState<string | null>(null);

  // Fetch MCP servers to find the Notion server
  const { data: mcpServers, error: mcpServersError } = useSWR(
    "/api/mcp/list",
    async () => {
      console.log("Fetching MCP servers...");
      try {
        const response = await fetch("/api/mcp/list");
        if (!response.ok) {
          throw new Error(
            `Failed to fetch MCP servers: ${response.status} ${response.statusText}`,
          );
        }
        const data = await response.json();
        console.log("MCP servers response:", data);
        return data;
      } catch (error) {
        console.error("Error fetching MCP servers:", error);
        throw error;
      }
    },
    {
      errorRetryCount: 3,
      errorRetryInterval: 1000,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  // Find the Notion MCP server
  useEffect(() => {
    if (mcpServersError) {
      console.error("Error fetching MCP servers:", mcpServersError);
      setError(`Failed to load MCP servers: ${mcpServersError.message}`);
      return;
    }

    if (mcpServers && Array.isArray(mcpServers)) {
      console.log("All MCP servers:", mcpServers);

      const notionServer = mcpServers.find(
        (server) =>
          server.name.toLowerCase().includes("notion") ||
          server.name.toLowerCase().includes("task"),
      );

      if (notionServer) {
        setNotionServerId(notionServer.id);
        console.log("Found Notion MCP server:", notionServer);

        // Check if the server is connected
        if (notionServer.status === "disconnected") {
          setError(
            `Notion MCP server is disconnected: ${notionServer.error || "Unknown error"}`,
          );
        } else if (notionServer.status === "connected") {
          setError(null); // Clear any previous errors
        } else {
          setError(`Notion MCP server status: ${notionServer.status}`);
        }
      } else {
        console.log(
          "Available MCP servers:",
          mcpServers.map((s) => ({
            id: s.id,
            name: s.name,
            status: s.status,
            toolCount: s.toolInfo?.length || 0,
          })),
        );
        setError(
          "Notion MCP server not found. Please configure a Notion MCP server first.",
        );
      }
    }
  }, [mcpServers, mcpServersError]);

  const fetchTasks = useCallback(
    async (databaseId: string, filter?: any) => {
      if (!notionServerId) {
        setError("Notion MCP server not configured");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await callMcpToolAction(notionServerId, "get_tasks", {
          database_id: databaseId,
          filter,
          limit: 50,
        });

        if (result?.content && Array.isArray(result.content)) {
          // Parse the result content
          const tasksText = result.content.find((c) => c.type === "text")?.text;
          if (tasksText) {
            try {
              const parsedTasks = JSON.parse(tasksText);
              if (Array.isArray(parsedTasks)) {
                setTasks(parsedTasks);
                setCurrentDatabaseId(databaseId);
              }
            } catch (parseError) {
              console.error("Failed to parse tasks:", parseError);
              setError("Failed to parse tasks from Notion");
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch tasks:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch tasks");
      } finally {
        setIsLoading(false);
      }
    },
    [notionServerId],
  );

  const createTask = useCallback(
    async (
      databaseId: string,
      task: Omit<NotionTask, "id" | "created_at">,
    ): Promise<NotionTask | null> => {
      if (!notionServerId) {
        setError("Notion MCP server not configured");
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await callMcpToolAction(notionServerId, "create_task", {
          database_id: databaseId,
          title: task.title,
          status: task.status,
          priority: task.priority,
          assignee: task.assignee,
          due_date: task.due_date,
          description: task.description,
        });

        if (result?.content && Array.isArray(result.content)) {
          const taskText = result.content.find((c) => c.type === "text")?.text;
          if (taskText) {
            try {
              const newTask = JSON.parse(taskText);
              if (newTask.id) {
                setTasks((prev) => [newTask, ...prev]);
                return newTask;
              }
            } catch (parseError) {
              console.error("Failed to parse created task:", parseError);
              setError("Failed to parse created task");
            }
          }
        }

        return null;
      } catch (err) {
        console.error("Failed to create task:", err);
        setError(err instanceof Error ? err.message : "Failed to create task");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [notionServerId],
  );

  const updateTask = useCallback(
    async (taskId: string, updates: Partial<NotionTask>) => {
      if (!notionServerId) {
        setError("Notion MCP server not configured");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await callMcpToolAction(notionServerId, "update_task", {
          task_id: taskId,
          ...updates,
        });

        if (result?.content && Array.isArray(result.content)) {
          const taskText = result.content.find((c) => c.type === "text")?.text;
          if (taskText) {
            try {
              const updatedTask = JSON.parse(taskText);
              setTasks((prev) =>
                prev.map((task) =>
                  task.id === taskId ? { ...task, ...updatedTask } : task,
                ),
              );
            } catch (parseError) {
              console.error("Failed to parse updated task:", parseError);
              setError("Failed to parse updated task");
            }
          }
        }
      } catch (err) {
        console.error("Failed to update task:", err);
        setError(err instanceof Error ? err.message : "Failed to update task");
      } finally {
        setIsLoading(false);
      }
    },
    [notionServerId],
  );

  const fetchDatabases = useCallback(async () => {
    if (!notionServerId) {
      setError("Notion MCP server not configured");
      return;
    }

    console.log("Fetching databases from server:", notionServerId);
    setIsLoading(true);
    setError(null);

    try {
      const result = await callMcpToolAction(
        notionServerId,
        "list_databases",
        {},
      );
      console.log("list_databases result:", result);

      if (result?.content && Array.isArray(result.content)) {
        const databasesText = result.content.find(
          (c) => c.type === "text",
        )?.text;
        if (databasesText) {
          try {
            const parsedDatabases = JSON.parse(databasesText);
            if (Array.isArray(parsedDatabases)) {
              setDatabases(parsedDatabases);
            }
          } catch (parseError) {
            console.error("Failed to parse databases:", parseError);
            setError("Failed to parse databases from Notion");
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch databases:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch databases",
      );
    } finally {
      setIsLoading(false);
    }
  }, [notionServerId]);

  const refreshTasks = useCallback(async () => {
    if (currentDatabaseId) {
      await fetchTasks(currentDatabaseId);
    }
  }, [currentDatabaseId, fetchTasks]);

  return {
    tasks,
    databases,
    isLoading,
    error,
    notionServerId,
    fetchTasks,
    createTask,
    updateTask,
    fetchDatabases,
    refreshTasks,
  };
}
