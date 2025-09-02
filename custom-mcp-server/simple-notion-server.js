const http = require("http");
const _url = require("url");

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // Handle SSE connection for MCP
  if (req.method === "GET" && req.url === "/mcp") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    });

    // Send initial connection event
    res.write("event: connected\n");
    res.write('data: {"type":"connected"}\n\n');

    // Keep connection alive
    const keepAlive = setInterval(() => {
      res.write("event: ping\n");
      res.write('data: {"type":"ping"}\n\n');
    }, 30000);

    req.on("close", () => {
      clearInterval(keepAlive);
    });

    return;
  }

  if (req.method === "POST" && req.url === "/mcp") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        const { jsonrpc, id, method, params } = data;

        if (method === "initialize") {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
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
            }),
          );
        } else if (method === "tools/list") {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              jsonrpc: "2.0",
              id,
              result: {
                tools: [
                  {
                    name: "get_tasks",
                    description:
                      "Get tasks from a Notion database with optional filtering",
                    inputSchema: {
                      type: "object",
                      properties: {
                        database_id: {
                          type: "string",
                          description:
                            "The Notion database ID to fetch tasks from",
                        },
                        filter: {
                          type: "object",
                          properties: {
                            status: {
                              type: "string",
                              enum: [
                                "Not Started",
                                "In Progress",
                                "Done",
                                "Blocked",
                              ],
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
                          description:
                            "The Notion database ID to create the task in",
                        },
                        title: {
                          type: "string",
                          description: "The title/name of the task",
                        },
                        status: {
                          type: "string",
                          enum: [
                            "Not Started",
                            "In Progress",
                            "Done",
                            "Blocked",
                          ],
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
                          enum: [
                            "Not Started",
                            "In Progress",
                            "Done",
                            "Blocked",
                          ],
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
              },
            }),
          );
        } else if (method === "tools/call") {
          const { name, arguments: args } = params;

          // Mock responses for tool calls
          let result;
          if (name === "get_tasks") {
            result = {
              content: [
                {
                  type: "text",
                  text: `Retrieved 2 tasks from Notion database ${args.database_id}`,
                },
                {
                  type: "text",
                  text: JSON.stringify(
                    [
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
                    ],
                    null,
                    2,
                  ),
                },
              ],
            };
          } else if (name === "create_task") {
            result = {
              content: [
                {
                  type: "text",
                  text: `Successfully created task: ${args.title}`,
                },
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      id: `task-${Date.now()}`,
                      title: args.title,
                      status: args.status || "Not Started",
                      priority: args.priority || "Medium",
                      assignee: args.assignee,
                      due_date: args.due_date,
                      description: args.description,
                      created_at: new Date().toISOString(),
                    },
                    null,
                    2,
                  ),
                },
              ],
            };
          } else if (name === "update_task") {
            result = {
              content: [
                {
                  type: "text",
                  text: `Successfully updated task: ${args.task_id}`,
                },
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      id: args.task_id,
                      ...args,
                      updated_at: new Date().toISOString(),
                    },
                    null,
                    2,
                  ),
                },
              ],
            };
          } else if (name === "list_databases") {
            result = {
              content: [
                {
                  type: "text",
                  text: "Found 2 databases",
                },
                {
                  type: "text",
                  text: JSON.stringify(
                    [
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
                    ],
                    null,
                    2,
                  ),
                },
              ],
            };
          } else {
            throw new Error(`Unknown tool: ${name}`);
          }

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              jsonrpc: "2.0",
              id,
              result,
            }),
          );
        } else {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              jsonrpc: "2.0",
              id,
              error: {
                code: -32601,
                message: "Method not found",
              },
            }),
          );
        }
      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            jsonrpc: "2.0",
            id: data.id,
            error: {
              code: -32603,
              message: "Internal error",
              data: error.message,
            },
          }),
        );
      }
    });
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  }
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Notion MCP server running on http://localhost:${PORT}/mcp`);
});
