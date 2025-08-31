/**
 * Docs Sync API Client
 * Integrates with the existing chat-gpt-brain Docs Sync API
 * This is much more efficient than duplicating GitHub functionality
 */

export interface DocsSyncConfig {
  baseUrl: string;
  prefix?: string;
  branch?: string;
}

export interface DocsTreeItem {
  path: string;
  sha: string;
  size?: number | null;
}

export interface DocsTreeResponse {
  branch: string;
  prefix: string;
  count: number;
  items: DocsTreeItem[];
}

export interface DocFileResponse {
  path: string;
  bytes: number;
  content: string;
}

export interface HealthResponse {
  ok: boolean;
  timestamp?: number;
  github_api?: string;
  cache?: string;
  cache_stats?: any;
  errors?: string[];
}

export class DocsSyncClient {
  private config: DocsSyncConfig;
  private etags: Map<string, string> = new Map();

  constructor(config: DocsSyncConfig) {
    this.config = {
      prefix: "docs/",
      branch: "main",
      ...config,
    };
  }

  /**
   * Check if the Docs Sync API is healthy
   */
  async healthCheck(): Promise<HealthResponse> {
    try {
      const response = await fetch(`${this.config.baseUrl}/health`);
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Health check error:", error);
      return { ok: false };
    }
  }

  /**
   * Get detailed health information
   */
  async detailedHealthCheck(): Promise<HealthResponse> {
    try {
      const response = await fetch(`${this.config.baseUrl}/health/detailed`);
      if (!response.ok) {
        throw new Error(`Detailed health check failed: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Detailed health check error:", error);
      return { ok: false };
    }
  }

  /**
   * List all documentation files under the docs/ prefix
   */
  async listDocsTree(prefix?: string): Promise<DocsTreeResponse> {
    const url = new URL(`${this.config.baseUrl}/docs-sync/tree`);
    url.searchParams.set("prefix", prefix || this.config.prefix || "docs/");

    const headers: HeadersInit = {};
    const etag = this.etags.get("tree");
    if (etag) {
      headers["If-None-Match"] = etag;
    }

    const response = await fetch(url.toString(), { headers });

    if (response.status === 304) {
      // Not modified - return cached data
      throw new Error("Not modified - use cached data");
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch docs tree: ${response.status}`);
    }

    // Store ETag for future requests
    const newEtag = response.headers.get("ETag");
    if (newEtag) {
      this.etags.set("tree", newEtag);
    }

    return await response.json();
  }

  /**
   * Fetch a single documentation file
   */
  async getDocFile(path: string): Promise<DocFileResponse> {
    const url = new URL(`${this.config.baseUrl}/docs-sync/file`);
    url.searchParams.set("path", path);

    const headers: HeadersInit = {};
    const etag = this.etags.get(path);
    if (etag) {
      headers["If-None-Match"] = etag;
    }

    const response = await fetch(url.toString(), { headers });

    if (response.status === 304) {
      // Not modified - return cached data
      throw new Error("Not modified - use cached data");
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch file ${path}: ${response.status}`);
    }

    // Store ETag for future requests
    const newEtag = response.headers.get("ETag");
    if (newEtag) {
      this.etags.set(path, newEtag);
    }

    return await response.json();
  }

  /**
   * Fetch multiple documentation files and combine them
   */
  async fetchMultipleDocs(
    paths: string[],
  ): Promise<{ [path: string]: string }> {
    const results: { [path: string]: string } = {};

    for (const path of paths) {
      try {
        const file = await this.getDocFile(path);
        results[path] = file.content;
      } catch (error) {
        console.warn(`Failed to fetch ${path}:`, error);
        // Continue with other files
      }
    }

    return results;
  }

  /**
   * Get all available documentation files
   */
  async getAllDocs(): Promise<DocsTreeItem[]> {
    try {
      const tree = await this.listDocsTree();
      return tree.items;
    } catch (error) {
      console.error("Failed to get docs tree:", error);
      return [];
    }
  }

  /**
   * Fetch documentation content optimized for custom GPT
   * Focuses on the most important docs based on your structure
   */
  async fetchCustomGPTPrompts(): Promise<string> {
    try {
      // Get the docs tree first
      const tree = await this.listDocsTree();

      // Define priority order for custom GPT
      const priorityPaths = [
        "docs/00-README.md",
        "docs/01-foundations.md",
        "docs/02-governance.md",
        "docs/03-security.md",
        "docs/04-tools.md",
        "docs/05-style.md",
        "docs/06-commands.md",
        "docs/07-knowledge-architecture.md",
      ];

      // Filter available paths and sort by priority
      const availablePaths = tree.items
        .map((item) => item.path)
        .filter((path) => priorityPaths.includes(path))
        .sort((a, b) => priorityPaths.indexOf(a) - priorityPaths.indexOf(b));

      // Fetch content from available files
      let combinedContent = "";
      let fetchedCount = 0;

      for (const path of availablePaths) {
        try {
          const file = await this.getDocFile(path);
          combinedContent += `\n\n## ${path.replace("docs/", "").replace(".md", "")}\nSource: ${path}\n\n${file.content}`;
          fetchedCount++;

          // Limit to prevent overwhelming the AI
          if (fetchedCount >= 6) {
            combinedContent += `\n\n*Note: Additional documentation sources are available but not included to maintain focus.*`;
            break;
          }
        } catch (error) {
          console.warn(`Failed to fetch ${path}:`, error);
          continue;
        }
      }

      if (fetchedCount === 0) {
        return "No documentation files could be fetched. Please check the Docs Sync API status.";
      }

      return combinedContent.trim();
    } catch (error) {
      console.error("Failed to fetch custom GPT prompts:", error);
      return "Failed to fetch documentation. Please check the Docs Sync API status.";
    }
  }

  /**
   * Debug cache and ETag state
   */
  async debugCache(): Promise<any> {
    try {
      const response = await fetch(`${this.config.baseUrl}/debug/cache`);
      if (!response.ok) {
        throw new Error(`Debug cache failed: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Debug cache error:", error);
      return {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Clear cached ETags
   */
  clearCache(): void {
    this.etags.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.etags.size,
      keys: Array.from(this.etags.keys()),
    };
  }
}

/**
 * Create a Docs Sync client for chat-gpt-brain
 */
export function createChatGPTBrainDocsSyncClient(
  baseUrl?: string,
): DocsSyncClient {
  return new DocsSyncClient({
    baseUrl: baseUrl || "https://1d4683e0c425.ngrok-free.app", // Default from your schema
    prefix: "docs/",
    branch: "main",
  });
}

/**
 * Create a custom GPT focused Docs Sync client
 */
export function createCustomGPTPromptClient(baseUrl?: string): DocsSyncClient {
  return new DocsSyncClient({
    baseUrl: baseUrl || "https://1d4683e0c425.ngrok-free.app",
    prefix: "docs/",
    branch: "main",
  });
}
