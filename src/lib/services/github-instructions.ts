import { Octokit } from "@octokit/rest";

export interface GitHubInstructionsConfig {
  owner: string;
  repo: string;
  branch?: string;
  instructionFiles?: string[];
  defaultInstructions?: string;
}

export class GitHubInstructionsService {
  private octokit: Octokit;
  private config: GitHubInstructionsConfig;

  constructor(config: GitHubInstructionsConfig, authToken?: string) {
    this.config = config;
    this.octokit = new Octokit({
      auth: authToken || process.env.GITHUB_TOKEN,
    });
  }

  /**
   * Fetch instructions from the GitHub repository
   * Focused on docs/ and dist/ folders for custom GPT prompts
   */
  async fetchInstructions(): Promise<string> {
    try {
      const {
        owner,
        repo,
        branch = "main",
        instructionFiles = this.getDefaultInstructionFiles(),
      } = this.config;

      let instructions = this.config.defaultInstructions || "";

      // Try to fetch instruction files in order of priority
      for (const filename of instructionFiles) {
        try {
          const response = await this.octokit.repos.getContent({
            owner,
            repo,
            path: filename,
            ref: branch,
          });

          if ("content" in response.data && response.data.type === "file") {
            const content = Buffer.from(
              response.data.content,
              "base64",
            ).toString("utf-8");
            instructions += `\n\n## Instructions from ${filename}\n${content}`;
            break; // Use the first successful file
          }
        } catch (error) {
          console.log(`Could not fetch ${filename}:`, error);
          continue;
        }
      }

      // If no instruction files found, try to get repo description and topics
      if (!instructions || instructions === this.config.defaultInstructions) {
        try {
          const repoInfo = await this.octokit.repos.get({ owner, repo });
          if (repoInfo.data.description) {
            instructions += `\n\n## Repository Description\n${repoInfo.data.description}`;
          }
          if (repoInfo.data.topics && repoInfo.data.topics.length > 0) {
            instructions += `\n\n## Repository Topics\n${repoInfo.data.topics.join(", ")}`;
          }
        } catch (error) {
          console.log("Could not fetch repo info:", error);
        }
      }

      return instructions.trim();
    } catch (error) {
      console.error("Error fetching GitHub instructions:", error);
      return (
        this.config.defaultInstructions ||
        "Unable to fetch instructions from GitHub repository."
      );
    }
  }

  /**
   * Fetch specific file content from the repository
   */
  async fetchFileContent(
    path: string,
    branch?: string,
  ): Promise<string | null> {
    try {
      const { owner, repo } = this.config;
      const response = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
        ref: branch || this.config.branch || "main",
      });

      if ("content" in response.data && response.data.type === "file") {
        return Buffer.from(response.data.content, "base64").toString("utf-8");
      }

      return null;
    } catch (error) {
      console.error(`Error fetching file ${path}:`, error);
      return null;
    }
  }

  /**
   * Fetch custom GPT prompts from docs/ and dist/ folders
   * This is the main method for getting the prompts you actually use
   */
  async fetchCustomGPTPrompts(): Promise<string> {
    try {
      const { owner, repo, branch = "main" } = this.config;

      // Focus on the folders you actually use for custom GPT
      const promptSources = [
        // Dist folder (compiled prompts)
        { path: "dist/system-prompt.md", title: "System Prompt" },

        // Docs folder (documentation and instructions)
        { path: "docs/00-README.md", title: "Documentation Overview" },
        { path: "docs/01-foundations.md", title: "Foundations" },
        { path: "docs/02-governance.md", title: "Governance" },
        { path: "docs/03-security.md", title: "Security" },
        { path: "docs/04-tools.md", title: "Tools" },
        { path: "docs/05-style.md", title: "Style Guide" },
        { path: "docs/06-commands.md", title: "Commands" },
        {
          path: "docs/07-knowledge-architecture.md",
          title: "Knowledge Architecture",
        },

        // Prompts folder (if you have one)
        { path: "prompts/system.mdx", title: "System Prompts" },
        { path: "prompts/fragments/tone-style.mdx", title: "Tone & Style" },
      ];

      let customGPTPrompts = this.config.defaultInstructions || "";
      let fetchedCount = 0;

      for (const source of promptSources) {
        try {
          const content = await this.fetchFileContent(source.path, branch);
          if (content) {
            customGPTPrompts += `\n\n## ${source.title}\nSource: ${source.path}\n\n${content}`;
            fetchedCount++;

            // Limit to prevent overwhelming the AI
            if (fetchedCount >= 8) {
              customGPTPrompts += `\n\n*Note: Additional prompt sources are available but not included to maintain focus.*`;
              break;
            }
          }
        } catch (error) {
          console.log(`Could not fetch ${source.path}:`, error);
          continue;
        }
      }

      if (fetchedCount === 0) {
        // Fallback to basic instructions
        return await this.fetchInstructions();
      }

      return customGPTPrompts.trim();
    } catch (error) {
      console.error("Error fetching custom GPT prompts:", error);
      return await this.fetchInstructions(); // Fallback to basic method
    }
  }

  /**
   * List available files in the repository
   */
  async listFiles(path: string = "", branch?: string): Promise<string[]> {
    try {
      const { owner, repo } = this.config;
      const response = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
        ref: branch || this.config.branch || "main",
      });

      if (Array.isArray(response.data)) {
        return response.data
          .filter((item) => item.type === "file")
          .map((item) => item.name);
      }

      return [];
    } catch (error) {
      console.error(`Error listing files in ${path}:`, error);
      return [];
    }
  }

  /**
   * Get the default instruction files based on custom GPT needs
   * Focused on docs/ and dist/ folders
   */
  private getDefaultInstructionFiles(): string[] {
    return [
      "dist/system-prompt.md", // Compiled system prompt
      "docs/00-README.md", // Documentation overview
      "docs/01-foundations.md", // Core foundations
      "docs/02-governance.md", // Governance rules
      "docs/03-security.md", // Security guidelines
      "docs/04-tools.md", // Tool usage
      "docs/05-style.md", // Style guide
      "docs/06-commands.md", // Command reference
      "docs/07-knowledge-architecture.md", // Knowledge structure
    ];
  }

  /**
   * Get repository statistics and metadata
   */
  async getRepositoryInfo(): Promise<{
    description?: string;
    topics: string[];
    language?: string;
    size: number;
    updatedAt: string;
    instructionFiles: string[];
  }> {
    try {
      const { owner, repo } = this.config;

      // Get repo info
      const repoResponse = await this.octokit.repos.get({ owner, repo });
      const repoData = repoResponse.data;

      // Get available instruction files
      const instructionFiles = await this.listFiles();
      const relevantFiles = instructionFiles.filter(
        (file) =>
          file.endsWith(".md") ||
          file.endsWith(".mdx") ||
          file.endsWith(".yaml") ||
          file.endsWith(".yml"),
      );

      return {
        description: repoData.description || undefined,
        topics: repoData.topics || [],
        language: repoData.language || undefined,
        size: repoData.size,
        updatedAt: repoData.updated_at,
        instructionFiles: relevantFiles,
      };
    } catch (error) {
      console.error("Error getting repository info:", error);
      return {
        topics: [],
        size: 0,
        updatedAt: new Date().toISOString(),
        instructionFiles: [],
      };
    }
  }
}

/**
 * Create a GitHub instructions service for chat-gpt-brain repository
 * Focused on docs/ and dist/ folders for custom GPT prompts
 */
export function createChatGPTBrainService(
  authToken?: string,
): GitHubInstructionsService {
  return new GitHubInstructionsService(
    {
      owner: "harrysayers", // Replace with your actual GitHub username
      repo: "chat-gpt-brain",
      branch: "main",
      instructionFiles: [
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
      defaultInstructions: `You are an AI assistant with access to the chat-gpt-brain repository prompts and documentation. This repository contains your core knowledge, behavioral guidelines, and operational policies from the docs/ and dist/ folders. Follow the instructions and policies defined in the repository to provide accurate, helpful, and compliant assistance.`,
    },
    authToken,
  );
}

/**
 * Create a custom GPT focused service for chat-gpt-brain
 * Specifically designed for the prompts you use in your custom GPT
 */
export function createCustomGPTPromptService(
  authToken?: string,
): GitHubInstructionsService {
  return new GitHubInstructionsService(
    {
      owner: "harrysayers", // Replace with your actual GitHub username
      repo: "chat-gpt-brain",
      branch: "main",
      instructionFiles: [
        "dist/system-prompt.md", // Your compiled system prompt
        "docs/00-README.md", // Documentation overview
        "docs/01-foundations.md", // Core foundations
        "docs/02-governance.md", // Governance rules
        "docs/03-security.md", // Security guidelines
        "docs/04-tools.md", // Tool usage
        "docs/05-style.md", // Style guide
        "docs/06-commands.md", // Command reference
        "docs/07-knowledge-architecture.md", // Knowledge structure
      ],
      defaultInstructions: `You are an AI assistant with access to the chat-gpt-brain custom GPT prompts and documentation. This repository contains your core knowledge base from the docs/ and dist/ folders, including system prompts, behavioral guidelines, operational policies, security protocols, tool usage guidelines, style guides, command references, and knowledge architecture. Always follow the most current and relevant instructions from the repository to provide accurate, helpful, and compliant assistance.`,
    },
    authToken,
  );
}
