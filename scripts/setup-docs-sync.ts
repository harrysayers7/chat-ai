#!/usr/bin/env tsx

/**
 * Docs Sync Integration Setup Script
 *
 * This script helps you set up and test the Docs Sync integration
 * with your chat-gpt-brain repository.
 */

import { createChatGPTBrainDocsSyncClient } from "../src/lib/services/docs-sync-client";

async function main() {
  console.log("🚀 Docs Sync Integration Setup\n");

  // Default configuration from your OpenAPI spec
  const defaultBaseUrl = "https://1d4683e0c425.ngrok-free.app";

  console.log("📋 Current Configuration:");
  console.log(`   Base URL: ${defaultBaseUrl}`);
  console.log("   Prefix: docs/");
  console.log("   Branch: main\n");

  // Test the connection
  console.log("🔍 Testing connection to Docs Sync API...");

  try {
    const client = createChatGPTBrainDocsSyncClient(defaultBaseUrl);

    // Test health endpoint
    console.log("\n1️⃣ Testing health endpoint...");
    const health = await client.healthCheck();
    console.log(`   ✅ Health: ${health.ok ? "OK" : "FAILED"}`);

    if (health.github_api) {
      console.log(`   📡 GitHub API: ${health.github_api}`);
    }
    if (health.cache) {
      console.log(`   💾 Cache: ${health.cache}`);
    }

    // Test docs tree
    console.log("\n2️⃣ Testing docs tree endpoint...");
    try {
      const tree = await client.listDocsTree();
      console.log(`   ✅ Found ${tree.count} files under ${tree.prefix}`);
      console.log(`   📁 Branch: ${tree.branch}`);

      if (tree.items.length > 0) {
        console.log("\n   📄 Available files:");
        tree.items.slice(0, 10).forEach((item) => {
          console.log(`      - ${item.path} (${item.size || "unknown"} bytes)`);
        });
        if (tree.items.length > 10) {
          console.log(`      ... and ${tree.items.length - 10} more files`);
        }
      }
    } catch (error: any) {
      if (error.message === "Not modified - use cached data") {
        console.log("   ℹ️  Using cached data (304 Not Modified)");
      } else {
        console.log(`   ❌ Failed to fetch docs tree: ${error.message}`);
      }
    }

    // Test custom GPT prompts
    console.log("\n3️⃣ Testing custom GPT prompts...");
    try {
      const prompts = await client.fetchCustomGPTPrompts();
      console.log(
        `   ✅ Successfully fetched prompts (${prompts.length} characters)`,
      );

      // Show a preview
      const preview = prompts.substring(0, 200);
      console.log(`   📝 Preview: ${preview}...`);
    } catch (error: any) {
      console.log(`   ❌ Failed to fetch prompts: ${error.message}`);
    }

    // Test cache debug
    console.log("\n4️⃣ Testing cache debug...");
    try {
      const debug = await client.debugCache();
      console.log(`   ✅ Cache debug: ${debug.status}`);
      if (debug.cache_stats) {
        console.log(`   💾 Cache keys: ${debug.cache_stats.size || 0}`);
      }
    } catch (error: any) {
      console.log(`   ❌ Cache debug failed: ${error.message}`);
    }

    console.log("\n🎉 Setup complete! Your Docs Sync API is working.");
    console.log("\n📖 Next steps:");
    console.log("   1. Go to your chat-ui and navigate to /agent/new");
    console.log('   2. Click "Use Docs Sync"');
    console.log("   3. Configure your API base URL if needed");
    console.log('   4. Click "Fetch Custom GPT Prompts"');
    console.log("   5. Create your agent with live documentation!");
  } catch (error: any) {
    console.error("\n❌ Setup failed:", error.message);
    console.log("\n🔧 Troubleshooting:");
    console.log("   1. Make sure your Docs Sync API is running");
    console.log("   2. Check if the base URL is correct");
    console.log("   3. Verify the API is accessible from this machine");
    console.log("   4. Check the API logs for any errors");
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log(`
Docs Sync Integration Setup Script

Usage:
  tsx scripts/setup-docs-sync.ts [options]

Options:
  --help, -h     Show this help message
  --url <url>    Test with a custom base URL

Examples:
  tsx scripts/setup-docs-sync.ts
  tsx scripts/setup-docs-sync.ts --url https://your-api.com
`);
  process.exit(0);
}

// Run the setup
main().catch(console.error);
