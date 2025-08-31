import { NextRequest, NextResponse } from "next/server";
import { getSession } from "auth/server";
import {
  createChatGPTBrainDocsSyncClient,
  createCustomGPTPromptClient,
} from "lib/services/docs-sync-client";
import logger from "logger";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const baseUrl =
      searchParams.get("baseUrl") || "https://1d4683e0c425.ngrok-free.app";
    const customGPT = searchParams.get("custom-gpt") === "true";
    const includeMetadata = searchParams.get("metadata") === "true";
    const action = searchParams.get("action") || "prompts"; // prompts, tree, health, debug

    // Create appropriate client
    const client = customGPT
      ? createCustomGPTPromptClient(baseUrl)
      : createChatGPTBrainDocsSyncClient(baseUrl);

    let result: any;
    let metadata: any = null;

    try {
      switch (action) {
        case "health":
          result = await client.healthCheck();
          break;

        case "health-detailed":
          result = await client.detailedHealthCheck();
          break;

        case "tree":
          result = await client.listDocsTree();
          break;

        case "debug":
          result = await client.debugCache();
          break;

        case "prompts":
        default:
          result = await client.fetchCustomGPTPrompts();
          break;
      }

      // Get additional metadata if requested
      if (includeMetadata && action === "prompts") {
        try {
          const tree = await client.listDocsTree();
          const cacheStats = client.getCacheStats();

          metadata = {
            availableFiles: tree.items.map((item) => item.path),
            totalFiles: tree.count,
            branch: tree.branch,
            prefix: tree.prefix,
            cacheStats,
          };
        } catch (error) {
          logger.warn("Could not fetch metadata:", error);
        }
      }
    } catch (error: any) {
      if (error.message === "Not modified - use cached data") {
        return NextResponse.json(
          { error: "Not modified - use cached data", cached: true },
          { status: 304 },
        );
      }
      throw error;
    }

    logger.info(
      `Docs Sync API: ${action} from ${baseUrl} for user ${session.user.id}`,
    );

    return NextResponse.json({
      result,
      source: {
        baseUrl,
        action,
        customGPT,
        timestamp: new Date().toISOString(),
      },
      ...(metadata && { metadata }),
    });
  } catch (error: any) {
    logger.error("Docs Sync API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch from Docs Sync API", details: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { baseUrl, customGPT = false, action = "prompts", paths } = body;

    // Validate required fields
    if (!baseUrl) {
      return NextResponse.json(
        { error: "Base URL is required" },
        { status: 400 },
      );
    }

    // Create client
    const client = customGPT
      ? createCustomGPTPromptClient(baseUrl)
      : createChatGPTBrainDocsSyncClient(baseUrl);

    let result: any;

    try {
      switch (action) {
        case "multiple-files":
          if (!paths || !Array.isArray(paths)) {
            return NextResponse.json(
              { error: "Paths array is required for multiple-files action" },
              { status: 400 },
            );
          }
          result = await client.fetchMultipleDocs(paths);
          break;

        case "prompts":
        default:
          result = await client.fetchCustomGPTPrompts();
          break;
      }
    } catch (error: any) {
      if (error.message === "Not modified - use cached data") {
        return NextResponse.json(
          { error: "Not modified - use cached data", cached: true },
          { status: 304 },
        );
      }
      throw error;
    }

    logger.info(
      `Docs Sync API POST: ${action} from ${baseUrl} for user ${session.user.id}`,
    );

    return NextResponse.json({
      result,
      source: {
        baseUrl,
        action,
        customGPT,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    logger.error("Docs Sync API POST error:", error);
    return NextResponse.json(
      { error: "Failed to fetch from Docs Sync API", details: error.message },
      { status: 500 },
    );
  }
}
