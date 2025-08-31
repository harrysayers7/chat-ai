import { getSession } from "auth/server";
import { NextResponse } from "next/server";
import { createNotionService } from "@/lib/services/notion-service";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    const databases = await notionService.listDatabases();

    return NextResponse.json(databases);
  } catch (error: any) {
    console.error("Error listing databases:", error);
    return NextResponse.json(
      { error: error.message || "Failed to list databases" },
      { status: 500 },
    );
  }
}
