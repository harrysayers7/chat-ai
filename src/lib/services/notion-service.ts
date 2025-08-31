import { z } from "zod";

// Notion API types
export interface NotionTask {
  id: string;
  title: string;
  status: "Not Started" | "In Progress" | "Done" | "Blocked";
  priority: "Low" | "Medium" | "High" | "Urgent";
  assignee?: string;
  due_date?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  url: string;
}

export interface NotionDatabase {
  id: string;
  title: string;
  description?: string;
  type: "database";
}

export interface CreateTaskRequest {
  database_id: string;
  title: string;
  status?: "Not Started" | "In Progress" | "Done" | "Blocked";
  priority?: "Low" | "Medium" | "High" | "Urgent";
  assignee?: string;
  due_date?: string;
  description?: string;
}

export interface UpdateTaskRequest {
  task_id: string;
  title?: string;
  status?: "Not Started" | "In Progress" | "Done" | "Blocked";
  priority?: "Low" | "Medium" | "High" | "Urgent";
  assignee?: string;
  due_date?: string;
  description?: string;
}

export interface TaskFilters {
  status?: "Not Started" | "In Progress" | "Done" | "Blocked";
  priority?: "Low" | "Medium" | "High" | "Urgent";
  assignee?: string;
}

export class NotionService {
  private apiKey: string;
  private baseUrl = "https://api.notion.com/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Notion API error: ${response.status} ${response.statusText}`,
      );
    }

    return response.json();
  }

  /**
   * Get tasks from a Notion database with optional filtering
   */
  async getTasks(
    databaseId: string,
    filters?: TaskFilters,
    limit: number = 20,
  ): Promise<NotionTask[]> {
    try {
      // Build filter for Notion API
      const filterConditions: any[] = [];

      if (filters?.status) {
        filterConditions.push({
          property: "Status",
          select: { equals: filters.status },
        });
      }

      if (filters?.priority) {
        filterConditions.push({
          property: "Priority",
          select: { equals: filters.priority },
        });
      }

      if (filters?.assignee) {
        filterConditions.push({
          property: "Assignee",
          people: { contains: filters.assignee },
        });
      }

      const response = await this.makeRequest(
        `/databases/${databaseId}/query`,
        {
          method: "POST",
          body: JSON.stringify({
            filter:
              filterConditions.length > 0
                ? {
                    and: filterConditions,
                  }
                : undefined,
            page_size: limit,
            sorts: [
              {
                property: "Created time",
                direction: "descending",
              },
            ],
          }),
        },
      );

      // Transform Notion response to our format
      return response.results.map((page: any) =>
        this.transformNotionPageToTask(page),
      );
    } catch (error) {
      console.error("Error fetching tasks from Notion:", error);
      throw error;
    }
  }

  /**
   * Create a new task in a Notion database
   */
  async createTask(request: CreateTaskRequest): Promise<NotionTask> {
    try {
      const response = await this.makeRequest("/pages", {
        method: "POST",
        body: JSON.stringify({
          parent: { database_id: request.database_id },
          properties: {
            Title: {
              title: [
                {
                  text: {
                    content: request.title,
                  },
                },
              ],
            },
            Status: {
              select: {
                name: request.status || "Not Started",
              },
            },
            Priority: {
              select: {
                name: request.priority || "Medium",
              },
            },
            ...(request.assignee && {
              Assignee: {
                people: [
                  {
                    name: request.assignee,
                  },
                ],
              },
            }),
            ...(request.due_date && {
              "Due Date": {
                date: {
                  start: request.due_date,
                },
              },
            }),
            ...(request.description && {
              Description: {
                rich_text: [
                  {
                    text: {
                      content: request.description,
                    },
                  },
                ],
              },
            }),
          },
        }),
      });

      return this.transformNotionPageToTask(response);
    } catch (error) {
      console.error("Error creating task in Notion:", error);
      throw error;
    }
  }

  /**
   * Update an existing task in Notion
   */
  async updateTask(request: UpdateTaskRequest): Promise<NotionTask> {
    try {
      const properties: any = {};

      if (request.title) {
        properties["Title"] = {
          title: [{ text: { content: request.title } }],
        };
      }

      if (request.status) {
        properties["Status"] = {
          select: { name: request.status },
        };
      }

      if (request.priority) {
        properties["Priority"] = {
          select: { name: request.priority },
        };
      }

      if (request.assignee) {
        properties["Assignee"] = {
          people: [{ name: request.assignee }],
        };
      }

      if (request.due_date) {
        properties["Due Date"] = {
          date: { start: request.due_date },
        };
      }

      if (request.description) {
        properties["Description"] = {
          rich_text: [{ text: { content: request.description } }],
        };
      }

      const response = await this.makeRequest(`/pages/${request.task_id}`, {
        method: "PATCH",
        body: JSON.stringify({ properties }),
      });

      return this.transformNotionPageToTask(response);
    } catch (error) {
      console.error("Error updating task in Notion:", error);
      throw error;
    }
  }

  /**
   * List available Notion databases
   */
  async listDatabases(): Promise<NotionDatabase[]> {
    try {
      const response = await this.makeRequest("/search", {
        method: "POST",
        body: JSON.stringify({
          filter: {
            property: "object",
            value: "database",
          },
        }),
      });

      return response.results.map((db: any) => ({
        id: db.id,
        title: db.title[0]?.plain_text || "Untitled Database",
        description: db.description?.[0]?.plain_text,
        type: "database" as const,
      }));
    } catch (error) {
      console.error("Error listing Notion databases:", error);
      throw error;
    }
  }

  /**
   * Transform Notion page object to our task format
   */
  private transformNotionPageToTask(page: any): NotionTask {
    const properties = page.properties;

    return {
      id: page.id,
      title: properties.Title?.title?.[0]?.plain_text || "Untitled",
      status: properties.Status?.select?.name || "Not Started",
      priority: properties.Priority?.select?.name || "Medium",
      assignee: properties.Assignee?.people?.[0]?.name,
      due_date: properties["Due Date"]?.date?.start,
      description: properties.Description?.rich_text?.[0]?.plain_text,
      created_at: page.created_time,
      updated_at: page.last_edited_time,
      url: page.url,
    };
  }

  /**
   * Test the connection to Notion API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest("/users/me");
      return true;
    } catch (error) {
      console.error("Notion API connection test failed:", error);
      return false;
    }
  }
}

// Factory function to create Notion service
export function createNotionService(apiKey: string): NotionService {
  return new NotionService(apiKey);
}
