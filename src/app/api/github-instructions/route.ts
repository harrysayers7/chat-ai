import { NextRequest, NextResponse } from "next/server";
import { getSession } from "auth/server";
import {
  createChatGPTBrainService,
  createCustomGPTPromptService,
} from "lib/services/github-instructions";
import logger from "logger";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get("owner") || "harrysayers"; // Default to your username
    const repo = searchParams.get("repo") || "chat-gpt-brain";
    const branch = searchParams.get("branch") || "main";
    const file = searchParams.get("file"); // Optional specific file
    const customGPT = searchParams.get("custom-gpt") === "true"; // New custom GPT mode
    const includeMetadata = searchParams.get("metadata") === "true"; // Include repo metadata

    // Create appropriate service instance
    let service;
    if (customGPT) {
      service = createCustomGPTPromptService();
    } else {
      service = createChatGPTBrainService();
    }

    let instructions: string;
    let metadata: any = null;

    if (file) {
      // Fetch specific file content
      const content = await service.fetchFileContent(file, branch);
      if (content) {
        instructions = content;
      } else {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }
    } else if (customGPT) {
      // Fetch custom GPT prompts from docs/ and dist/ folders
      instructions = await service.fetchCustomGPTPrompts();
    } else {
      // Fetch general instructions
      instructions = await service.fetchInstructions();
    }

    // Get repository metadata if requested
    if (includeMetadata) {
      try {
        metadata = await service.getRepositoryInfo();
      } catch (error) {
        logger.warn("Could not fetch repository metadata:", error);
      }
    }

    logger.info(
      `Fetched ${customGPT ? "custom GPT " : ""}instructions from ${owner}/${repo} for user ${session.user.id}`,
    );

    return NextResponse.json({
      instructions,
      source: {
        owner,
        repo,
        branch,
        file: file || null,
        customGPT,
        timestamp: new Date().toISOString(),
      },
      ...(metadata && { metadata }),
    });
  } catch (error: any) {
    logger.error("Error fetching GitHub instructions:", error);
    return NextResponse.json(
      { error: "Failed to fetch instructions from GitHub" },
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
    const { owner, repo, branch, instructionFiles, customGPT = false } = body;

    // Validate required fields
    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Owner and repo are required" },
        { status: 400 },
      );
    }

    // Create custom service instance
    const { GitHubInstructionsService } = await import(
      "lib/services/github-instructions"
    );
    const service = new GitHubInstructionsService({
      owner,
      repo,
      branch: branch || "main",
      instructionFiles: instructionFiles || [
        "dist/system-prompt.md",
        "docs/00-README.md",
        "docs/01-foundations.md",
        "docs/02-governance.md",
        "docs/03-security.md",
        "docs/04-tools.md",
        "docs/05-style.md",
        "docs/06-commands.md",
        "docs/07-knowledge-architecture.md",
      ],
      defaultInstructions: `You are an AI assistant with access to the ${owner}/${repo} repository prompts and documentation.`,
    });

    let instructions: string;
    if (customGPT) {
      instructions = await service.fetchCustomGPTPrompts();
    } else {
      instructions = await service.fetchInstructions();
    }

    logger.info(
      `Fetched ${customGPT ? "custom GPT " : ""}instructions from ${owner}/${repo} for user ${session.user.id}`,
    );

    return NextResponse.json({
      instructions,
      source: {
        owner,
        repo,
        branch: branch || "main",
        customGPT,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    logger.error("Error fetching custom GitHub instructions:", error);
    return NextResponse.json(
      { error: "Failed to fetch instructions from GitHub" },
      { status: 500 },
    );
  }
}
