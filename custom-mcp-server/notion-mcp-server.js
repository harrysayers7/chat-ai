#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Create the server
const server = new Server(
  {
    name: "notion-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Mock data for demonstration
const mockTasks = [
  {
    id: "task-1",
    title: "Complete project documentation",
    status: "In Progress",
    priority: "High",
    assignee: "John Doe",
    due_date: "2024-01-15",
    created_at: "2024-01-01T10:00:00Z",
  },
  {
    id: "task-2",
    title: "Review code changes",
    status: "Not Started",
    priority: "Medium",
    assignee: "Jane Smith",
    due_date: "2024-01-20",
    created_at: "2024-01-02T14:30:00Z",
  },
];

const mockDatabases = [
  {
    id: "db-1",
    title: "Project Tasks",
    description: "Main project management database",
    type: "database",
  },
  {
    id: "db-2",
    title: "Personal Goals",
    description: "Personal goal tracking",
    type: "database",
  },
];

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_tasks",
        description: "Get tasks from a Notion database with optional filtering",
        inputSchema: {
          type: "object",
          properties: {
            database_id: {
              type: "string",
              description: "The Notion database ID to fetch tasks from",
            },
            filter: {
              type: "object",
              properties: {
                status: {
                  type: "string",
                  enum: ["Not Started", "In Progress", "Done", "Blocked"],
                },
                priority: {
                  type: "string",
                  enum: ["Low", "Medium", "High", "Urgent"],
                },
                assignee: {
                  type: "string",
                },
              },
            },
            limit: {
              type: "number",
              minimum: 1,
              maximum: 100,
              default: 20,
              description: "Maximum number of tasks to return",
            },
          },
          required: ["database_id"],
        },
      },
      {
        name: "create_task",
        description: "Create a new task in a Notion database",
        inputSchema: {
          type: "object",
          properties: {
            database_id: {
              type: "string",
              description: "The Notion database ID to create the task in",
            },
            title: {
              type: "string",
              description: "The title/name of the task",
            },
            status: {
              type: "string",
              enum: ["Not Started", "In Progress", "Done", "Blocked"],
              default: "Not Started",
            },
            priority: {
              type: "string",
              enum: ["Low", "Medium", "High", "Urgent"],
              default: "Medium",
            },
            assignee: {
              type: "string",
            },
            due_date: {
              type: "string",
              description: "Due date in YYYY-MM-DD format",
            },
            description: {
              type: "string",
            },
          },
          required: ["database_id", "title"],
        },
      },
      {
        name: "update_task",
        description: "Update an existing task in Notion",
        inputSchema: {
          type: "object",
          properties: {
            task_id: {
              type: "string",
              description: "The ID of the task to update",
            },
            title: {
              type: "string",
            },
            status: {
              type: "string",
              enum: ["Not Started", "In Progress", "Done", "Blocked"],
            },
            priority: {
              type: "string",
              enum: ["Low", "Medium", "High", "Urgent"],
            },
            assignee: {
              type: "string",
            },
            due_date: {
              type: "string",
              description: "Due date in YYYY-MM-DD format",
            },
            description: {
              type: "string",
            },
          },
          required: ["task_id"],
        },
      },
      {
        name: "list_databases",
        description:
          "List available Notion databases for the authenticated user",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "get_tasks": {
      const { database_id, filter, limit = 20 } = args;

      // Filter tasks based on criteria
      let filteredTasks = mockTasks;
      if (filter) {
        filteredTasks = mockTasks.filter((task) => {
          if (filter.status && task.status !== filter.status) return false;
          if (filter.priority && task.priority !== filter.priority)
            return false;
          if (filter.assignee && task.assignee !== filter.assignee)
            return false;
          return true;
        });
      }

      // Limit results
      const limitedTasks = filteredTasks.slice(0, limit);

      return {
        content: [
          {
            type: "text",
            text: `Retrieved ${limitedTasks.length} tasks from Notion database ${database_id}`,
          },
          {
            type: "text",
            text: JSON.stringify(limitedTasks, null, 2),
          },
        ],
      };
    }

    case "create_task": {
      const {
        database_id,
        title,
        status = "Not Started",
        priority = "Medium",
        assignee,
        due_date,
        description,
      } = args;

      const newTask = {
        id: `task-${Date.now()}`,
        title,
        status,
        priority,
        assignee,
        due_date,
        description,
        created_at: new Date().toISOString(),
      };

      // Add to mock data
      mockTasks.unshift(newTask);

      return {
        content: [
          {
            type: "text",
            text: `Successfully created task: ${title}`,
          },
          {
            type: "text",
            text: JSON.stringify(newTask, null, 2),
          },
        ],
      };
    }

    case "update_task": {
      const { task_id, ...updates } = args;

      const taskIndex = mockTasks.findIndex((task) => task.id === task_id);
      if (taskIndex === -1) {
        throw new Error(`Task with ID ${task_id} not found`);
      }

      const updatedTask = {
        ...mockTasks[taskIndex],
        ...updates,
        updated_at: new Date().toISOString(),
      };

      mockTasks[taskIndex] = updatedTask;

      return {
        content: [
          {
            type: "text",
            text: `Successfully updated task: ${task_id}`,
          },
          {
            type: "text",
            text: JSON.stringify(updatedTask, null, 2),
          },
        ],
      };
    }

    case "list_databases": {
      return {
        content: [
          {
            type: "text",
            text: `Found ${mockDatabases.length} databases`,
          },
          {
            type: "text",
            text: JSON.stringify(mockDatabases, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Notion MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
