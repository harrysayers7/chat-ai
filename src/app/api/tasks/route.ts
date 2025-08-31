import { getSession } from "auth/server";
import { NextResponse } from "next/server";
import { createNotionService } from "@/lib/services/notion-service";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const databaseId = searchParams.get("database_id");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assignee = searchParams.get("assignee");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!databaseId) {
      return NextResponse.json(
        { error: "Database ID is required" },
        { status: 400 },
      );
    }

    // Get Notion API key from environment or user preferences
    const notionApiKey = process.env.NOTION_API_KEY;
    if (!notionApiKey) {
      return NextResponse.json(
        { error: "Notion API key not configured" },
        { status: 500 },
      );
    }

    const notionService = createNotionService(notionApiKey);

    const filters = {
      ...(status && { status: status as any }),
      ...(priority && { priority: priority as any }),
      ...(assignee && { assignee }),
    };

    const tasks = await notionService.getTasks(databaseId, filters, limit);

    return NextResponse.json(tasks);
  } catch (error: any) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch tasks" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      database_id,
      title,
      status,
      priority,
      assignee,
      due_date,
      description,
    } = body;

    if (!database_id || !title) {
      return NextResponse.json(
        { error: "Database ID and title are required" },
        { status: 400 },
      );
    }

    // Get Notion API key from environment
    const notionApiKey = process.env.NOTION_API_KEY;
    if (!notionApiKey) {
      return NextResponse.json(
        { error: "Notion API key not configured" },
        { status: 500 },
      );
    }

    const notionService = createNotionService(notionApiKey);

    const newTask = await notionService.createTask({
      database_id,
      title,
      status,
      priority,
      assignee,
      due_date,
      description,
    });

    return NextResponse.json(newTask);
  } catch (error: any) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create task" },
      { status: 500 },
    );
  }
}
