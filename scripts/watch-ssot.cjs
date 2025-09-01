#!/usr/bin/env node
/**
 * SSOT Watcher Script
 * 
 * This script monitors the codebase for architectural changes and
 * automatically updates the SSOT document. It integrates with the
 * existing automation system and can be run alongside other watchers.
 */

const _fs = require("fs");
const _path = require("path");
const chokidar = require("chokidar");
const IntelligentSSOTUpdater = require("./intelligent-ssot-updater.cjs");

// Configuration
const WATCH_PATTERNS = [
  "package.json",
  "CHANGELOG.md",
  "src/**/*",
  "docs/**/*",
  "scripts/**/*",
  "*.config.*",
  "*.json"
];

const IGNORE_PATTERNS = [
  "node_modules/**",
  ".git/**",
  ".next/**",
  "dist/**",
  "build/**",
  "coverage/**",
  "*.log",
  "*.tmp"
];

class SSOTWatcher {
  constructor() {
    this.updater = new IntelligentSSOTUpdater();
    this.watcher = null;
    this.isRunning = false;
    this.debounceTimer = null;
    this.debounceDelay = 2000; // 2 seconds
  }

  start() {
    console.log("🚀 Starting SSOT Auto-Update Watcher");
    console.log("=====================================\n");
    
    if (this.isRunning) {
      console.log("⚠️  Watcher is already running");
      return;
    }

    this.isRunning = true;
    
    // Initialize the watcher
    this.watcher = chokidar.watch(WATCH_PATTERNS, {
      ignored: IGNORE_PATTERNS,
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 1000,
        pollInterval: 100
      }
    });

    // Set up event handlers
    this.setupEventHandlers();
    
    console.log("👀 Watching for architectural changes...");
    console.log("📁 Monitored patterns:", WATCH_PATTERNS.join(", "));
    console.log("🚫 Ignored patterns:", IGNORE_PATTERNS.join(", "));
    console.log("\n💡 The SSOT document will be automatically updated when changes are detected.");
    console.log("⏰ Updates are debounced by 2 seconds to avoid excessive updates.");
    console.log("\n🛑 Press Ctrl+C to stop the watcher\n");
  }

  setupEventHandlers() {
    this.watcher
      .on('add', (filePath) => this.handleFileChange('added', filePath))
      .on('change', (filePath) => this.handleFileChange('modified', filePath))
      .on('unlink', (filePath) => this.handleFileChange('removed', filePath))
      .on('addDir', (dirPath) => this.handleDirectoryChange('added', dirPath))
      .on('unlinkDir', (dirPath) => this.handleDirectoryChange('removed', dirPath))
      .on('error', (error) => this.handleError(error))
      .on('ready', () => this.handleReady());
  }

  handleFileChange(type, filePath) {
    if (this.isSignificantFile(filePath)) {
      console.log(`📝 ${type}: ${filePath}`);
      this.scheduleUpdate();
    }
  }

  handleDirectoryChange(type, dirPath) {
    console.log(`📁 ${type}: ${dirPath}`);
    this.scheduleUpdate();
  }

  handleError(error) {
    console.error("❌ Watcher error:", error);
  }

  handleReady() {
    console.log("✅ Watcher is ready and monitoring files");
  }

  isSignificantFile(filePath) {
    const significantPatterns = [
      /\.(ts|tsx|js|jsx)$/,
      /\.(md|mdx)$/,
      /\.(json|yaml|yml)$/,
      /\.(sh|bash)$/,
      /package\.json$/,
      /CHANGELOG\.md$/,
      /\.config\.(js|ts|json)$/
    ];
    
    return significantPatterns.some(pattern => pattern.test(filePath));
  }

  scheduleUpdate() {
    // Clear existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Set new timer
    this.debounceTimer = setTimeout(() => {
      this.performUpdate();
    }, this.debounceDelay);
  }

  async performUpdate() {
    try {
      console.log("\n🔄 Detected changes, updating SSOT document...");
      
      // Run the intelligent updater
      await this.updater.run();
      
      console.log("✅ SSOT update completed");
      
    } catch (error) {
      console.error("❌ Failed to update SSOT:", error.message);
    }
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    
    this.isRunning = false;
    console.log("\n🛑 SSOT watcher stopped");
  }

  // Graceful shutdown
  setupGracefulShutdown() {
    process.on('SIGINT', () => {
      console.log("\n\n🛑 Received SIGINT, shutting down gracefully...");
      this.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log("\n\n🛑 Received SIGTERM, shutting down gracefully...");
      this.stop();
      process.exit(0);
    });

    process.on('uncaughtException', (error) => {
      console.error("❌ Uncaught exception:", error);
      this.stop();
      process.exit(1);
    });
  }
}

// Main execution
if (require.main === module) {
  const watcher = new SSOTWatcher();
  
  // Set up graceful shutdown
  watcher.setupGracefulShutdown();
  
  // Start watching
  watcher.start();
}

module.exports = SSOTWatcher;

