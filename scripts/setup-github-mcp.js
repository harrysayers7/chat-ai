#!/usr/bin/env node

/**
 * GitHub MCP Setup Script
 *
 * This script helps set up and test the GitHub MCP integration
 * in the chat-ai application.
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${colors.cyan}=== Step ${step}: ${message} ===${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, "green");
}

function logError(message) {
  log(`❌ ${message}`, "red");
}

function logWarning(message) {
  log(`⚠️  ${message}`, "yellow");
}

function logInfo(message) {
  log(`ℹ️  ${message}`, "blue");
}

async function checkPrerequisites() {
  logStep(1, "Checking Prerequisites");

  // Check if Node.js is installed
  try {
    const nodeVersion = execSync("node --version", { encoding: "utf8" }).trim();
    logSuccess(`Node.js version: ${nodeVersion}`);
  } catch (_error) {
    logError("Node.js is not installed or not in PATH");
    return false;
  }

  // Check if pnpm is installed
  try {
    const pnpmVersion = execSync("pnpm --version", { encoding: "utf8" }).trim();
    logSuccess(`pnpm version: ${pnpmVersion}`);
  } catch (_error) {
    logError("pnpm is not installed. Please install pnpm: npm install -g pnpm");
    return false;
  }

  // Check if GitHub token is available
  if (!process.env.GITHUB_TOKEN) {
    logWarning("GITHUB_TOKEN environment variable is not set");
    logInfo(
      "Please set your GitHub token: export GITHUB_TOKEN=your_token_here",
    );
    return false;
  } else {
    logSuccess("GitHub token is available");
  }

  return true;
}

async function checkMCPConfiguration() {
  logStep(2, "Checking MCP Configuration");

  const configPath = ".mcp-config.json";

  if (!fs.existsSync(configPath)) {
    logError(`MCP configuration file not found: ${configPath}`);
    return false;
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

    if (!config["github-mcp"]) {
      logError("GitHub MCP configuration not found in .mcp-config.json");
      return false;
    }

    logSuccess("GitHub MCP configuration found");
    logInfo("Configuration:");
    console.log(JSON.stringify(config["github-mcp"], null, 2));

    return true;
  } catch (error) {
    logError(`Failed to parse MCP configuration: ${error.message}`);
    return false;
  }
}

async function checkDependencies() {
  logStep(3, "Checking Dependencies");

  const packageJsonPath = "package.json";

  if (!fs.existsSync(packageJsonPath)) {
    logError("package.json not found. Are you in the correct directory?");
    return false;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

    if (
      !packageJson.dependencies ||
      !packageJson.dependencies["@modelcontextprotocol/server-github"]
    ) {
      logWarning("GitHub MCP server package not found in dependencies");
      logInfo("This is normal - the package is installed via npx");
    }

    logSuccess("Dependencies check completed");
    return true;
  } catch (error) {
    logError(`Failed to check dependencies: ${error.message}`);
    return false;
  }
}

async function testGitHubMCPConnection() {
  logStep(4, "Testing GitHub MCP Connection");

  try {
    // Test if we can run the GitHub MCP server
    logInfo("Testing GitHub MCP server availability...");

    const _result = execSync("npx @modelcontextprotocol/server-github --help", {
      encoding: "utf8",
      stdio: "pipe",
      timeout: 10000,
    });

    logSuccess("GitHub MCP server is available");
    return true;
  } catch (error) {
    logWarning(`GitHub MCP server test failed: ${error.message}`);
    logInfo("This might be normal if the server requires specific parameters");
    return true; // Don't fail the setup for this
  }
}

async function checkDevelopmentServer() {
  logStep(5, "Checking Development Server");

  try {
    logInfo("Testing if development server is running...");

    const response = await fetch("http://localhost:3000/api/mcp/list");

    if (response.ok) {
      const mcpList = await response.json();
      logSuccess("Development server is running");

      const githubMcp = mcpList.find((mcp) => mcp.name.includes("github"));
      if (githubMcp) {
        logSuccess("GitHub MCP server found in MCP list");
        logInfo(`Status: ${githubMcp.status}`);
        logInfo(`Tools: ${githubMcp.toolInfo?.length || 0}`);
      } else {
        logWarning("GitHub MCP server not found in MCP list");
        logInfo("This might be normal if the server is still loading");
      }

      return true;
    } else {
      logError(`Development server returned error: ${response.status}`);
      return false;
    }
  } catch (error) {
    logWarning(`Development server is not running: ${error.message}`);
    logInfo("Start the development server with: pnpm dev");
    return false;
  }
}

async function provideNextSteps() {
  logStep(6, "Next Steps");

  logInfo("To complete the GitHub MCP setup:");
  console.log(`
1. **Start the Development Server**:
   ${colors.cyan}pnpm dev${colors.reset}

2. **Open the MCP Dashboard**:
   ${colors.cyan}http://localhost:3000/mcp${colors.reset}

3. **Enable GitHub MCP Server**:
   - Look for "github-mcp" in the MCP dashboard
   - Click to enable the server
   - Wait for it to show "connected" status

4. **Test in Chat Interface**:
   - Go to ${colors.cyan}http://localhost:3000/chat${colors.reset}
   - Type ${colors.cyan}@${colors.reset} to see available GitHub tools
   - Try commands like:
     - "Search for repositories containing 'chat-ai'"
     - "List recent commits from my repository"
     - "Get the contents of README.md"

5. **Create Tool Presets** (Optional):
   - Go to tool selection dropdown
   - Create presets for common GitHub workflows
   - Enable specific GitHub tools for your use case
  `);

  logInfo("For more information, see:");
  logInfo("- docs/tips-guides/adding-github-mcp-to-chat-interface.md");
  logInfo("- docs/tips-guides/github-mcp-quick-reference.md");
  logInfo("- docs/rules/github-mcp-rules.md");
}

async function main() {
  log(
    `${colors.bright}${colors.magenta}GitHub MCP Setup Script${colors.reset}`,
  );
  log(`${colors.cyan}=====================================${colors.reset}\n`);

  try {
    // Check prerequisites
    const prerequisitesOk = await checkPrerequisites();
    if (!prerequisitesOk) {
      logError(
        "Prerequisites check failed. Please fix the issues above and try again.",
      );
      process.exit(1);
    }

    // Check MCP configuration
    const configOk = await checkMCPConfiguration();
    if (!configOk) {
      logError(
        "MCP configuration check failed. Please fix the issues above and try again.",
      );
      process.exit(1);
    }

    // Check dependencies
    const depsOk = await checkDependencies();
    if (!depsOk) {
      logError(
        "Dependencies check failed. Please fix the issues above and try again.",
      );
      process.exit(1);
    }

    // Test GitHub MCP connection
    await testGitHubMCPConnection();

    // Check development server
    const serverOk = await checkDevelopmentServer();

    // Provide next steps
    await provideNextSteps();

    if (serverOk) {
      logSuccess("\nGitHub MCP setup is ready! 🎉");
    } else {
      logWarning(
        "\nGitHub MCP setup is mostly ready, but the development server needs to be started.",
      );
    }
  } catch (error) {
    logError(`Setup failed with error: ${error.message}`);
    process.exit(1);
  }
}

// Run the setup
main().catch((error) => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
});
