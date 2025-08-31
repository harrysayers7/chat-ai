import { getSession } from "auth/server";
import { NextResponse } from "next/server";
import { createNotionService } from "@/lib/services/notion-service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const body = await request.json();
    const { title, status, priority, assignee, due_date, description } = body;

    // Get Notion API key from environment
    const notionApiKey = process.env.NOTION_API_KEY;
    if (!notionApiKey) {
      return NextResponse.json(
        { error: "Notion API key not configured" },
        { status: 500 },
      );
    }

    const notionService = createNotionService(notionApiKey);

    const updatedTask = await notionService.updateTask({
      task_id: resolvedParams.id,
      title,
      status,
      priority,
      assignee,
      due_date,
      description,
    });

    return NextResponse.json(updatedTask);
  } catch (error: any) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update task" },
      { status: 500 },
    );
  }
}
