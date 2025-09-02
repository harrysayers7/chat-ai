import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const server = new McpServer({
  name: "notion-tasks",
  version: "1.0.0",
});

// Tool to get tasks from a Notion database
server.tool(
  "get_tasks",
  "Get tasks from a Notion database with optional filtering",
  {
    database_id: z
      .string()
      .describe("The Notion database ID to fetch tasks from"),
    filter: z
      .object({
        status: z
          .enum(["Not Started", "In Progress", "Done", "Blocked"])
          .optional(),
        priority: z.enum(["Low", "Medium", "High", "Urgent"]).optional(),
        assignee: z.string().optional(),
      })
      .optional(),
    limit: z
      .number()
      .min(1)
      .max(100)
      .default(20)
      .describe("Maximum number of tasks to return"),
  },
  async ({ database_id, filter, limit }) => {
    try {
      // This would be implemented with actual Notion API calls
      // For now, returning a mock response structure
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

      return {
        content: [
          {
            type: "text",
            text: `Retrieved ${mockTasks.length} tasks from Notion database ${database_id}`,
          },
          {
            type: "text",
            text: JSON.stringify(mockTasks, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching tasks: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
      };
    }
  },
);

// Tool to create a new task
server.tool(
  "create_task",
  "Create a new task in a Notion database",
  {
    database_id: z
      .string()
      .describe("The Notion database ID to create the task in"),
    title: z.string().describe("The title/name of the task"),
    status: z
      .enum(["Not Started", "In Progress", "Done", "Blocked"])
      .default("Not Started"),
    priority: z.enum(["Low", "Medium", "High", "Urgent"]).default("Medium"),
    assignee: z.string().optional(),
    due_date: z.string().optional().describe("Due date in YYYY-MM-DD format"),
    description: z.string().optional(),
  },
  async ({
    database_id,
    title,
    status,
    priority,
    assignee,
    due_date,
    description,
  }) => {
    try {
      // This would be implemented with actual Notion API calls
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
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating task: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
      };
    }
  },
);

// Tool to update an existing task
server.tool(
  "update_task",
  "Update an existing task in Notion",
  {
    task_id: z.string().describe("The ID of the task to update"),
    title: z.string().optional(),
    status: z
      .enum(["Not Started", "In Progress", "Done", "Blocked"])
      .optional(),
    priority: z.enum(["Low", "Medium", "High", "Urgent"]).optional(),
    assignee: z.string().optional(),
    due_date: z.string().optional().describe("Due date in YYYY-MM-DD format"),
    description: z.string().optional(),
  },
  async ({ task_id, ...updates }) => {
    try {
      // This would be implemented with actual Notion API calls
      const updatedTask = {
        id: task_id,
        ...updates,
        updated_at: new Date().toISOString(),
      };

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
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error updating task: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
      };
    }
  },
);

// Tool to get available Notion databases
server.tool(
  "list_databases",
  "List available Notion databases for the authenticated user",
  {},
  async () => {
    try {
      // This would be implemented with actual Notion API calls
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
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error listing databases: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
      };
    }
  },
);

// HTTP endpoint for MCP protocol
app.post("/mcp", async (req, res) => {
  try {
    const { jsonrpc, id, method, params } = req.body;

    if (method === "initialize") {
      res.json({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: "Notion API",
            version: "1.0.0",
          },
        },
      });
    } else if (method === "tools/list") {
      const tools = await server.listTools();
      res.json({
        jsonrpc: "2.0",
        id,
        result: {
          tools: tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
          })),
        },
      });
    } else if (method === "tools/call") {
      const { name, arguments: args } = params;
      const result = await server.callTool(name, args);
      res.json({
        jsonrpc: "2.0",
        id,
        result,
      });
    } else {
      res.status(400).json({
        jsonrpc: "2.0",
        id,
        error: {
          code: -32601,
          message: "Method not found",
        },
      });
    }
  } catch (error) {
    res.status(500).json({
      jsonrpc: "2.0",
      id: req.body.id,
      error: {
        code: -32603,
        message: "Internal error",
        data: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Notion MCP server running on http://localhost:${PORT}/mcp`);
});
