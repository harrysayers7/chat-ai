import { z } from "zod";
import { tool as createTool } from "ai";
import { getManifest, getFile } from "@/lib/mokaiClient";

export const mokaiTools = {
  getRepoManifest: createTool({
    description:
      "Get manifest for a repo at a commit to discover available files.",
    parameters: z.object({
      repo: z.string().default(process.env.MOKAI_DEFAULT_REPO || ""),
      commit: z
        .string()
        .describe(
          "Commit SHA (preferred). If unknown, use 'HEAD' after resolving the branch.",
        ),
    }),
    execute: async ({ repo, commit }: { repo: string; commit: string }) => {
      return await getManifest(repo, commit);
    },
  }),

  getRepoFile: createTool({
    description:
      "Fetch a file from the repo via MCP Bridge (by commit or branch ref).",
    parameters: z.object({
      repo: z.string().default(process.env.MOKAI_DEFAULT_REPO || ""),
      ref: z
        .string()
        .default(process.env.MOKAI_DEFAULT_BRANCH || "refs/heads/main"),
      path: z
        .string()
        .describe(
          "Path within repo (e.g. .cursor/rules/*.mdc or src/index.ts)",
        ),
    }),
    execute: async ({
      repo,
      ref,
      path,
    }: { repo: string; ref: string; path: string }) => {
      const content = await getFile(repo, ref, path);
      return { repo, ref, path, content };
    },
  }),
};
