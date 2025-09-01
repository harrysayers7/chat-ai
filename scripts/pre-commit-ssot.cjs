#!/usr/bin/env node
/**
 * Pre-commit SSOT Update Hook
 * 
 * This script runs automatically before each git commit to ensure
 * the SSOT document is up to date with any architectural changes.
 * 
 * It integrates with Husky and can be run manually or as part of
 * the git workflow.
 */

const { execSync } = require("child_process");
const IntelligentSSOTUpdater = require("./intelligent-ssot-updater.cjs");

class PreCommitSSOTUpdater {
  constructor() {
    this.updater = new IntelligentSSOTUpdater();
    this.isGitHook = process.env.HUSKY === '1';
  }

  async run() {
    console.log("🚀 Pre-commit SSOT Update Hook");
    console.log("===============================\n");

    try {
      // Check if we're in a git repository
      if (!this.isGitRepository()) {
        console.log("⚠️  Not in a git repository, skipping SSOT update");
        return;
      }

      // Check if SSOT file has been modified
      if (this.isSSOTModified()) {
        console.log("📝 SSOT file has been modified, updating...");
        await this.updateSSOT();
        
        // Stage the updated SSOT file
        this.stageSSOTFile();
        
        console.log("✅ SSOT updated and staged for commit");
      } else {
        console.log("✅ SSOT file is up to date");
      }

      // Check for architectural changes that should trigger an update
      if (await this.hasArchitecturalChanges()) {
        console.log("🔍 Architectural changes detected, updating SSOT...");
        await this.updateSSOT();
        
        // Stage the updated SSOT file
        this.stageSSOTFile();
        
        console.log("✅ SSOT updated with architectural changes and staged for commit");
      }

      console.log("\n🎯 Pre-commit SSOT check complete!");

    } catch (error) {
      console.error("❌ Pre-commit SSOT update failed:", error.message);
      
      if (this.isGitHook) {
        console.error("🚫 Commit blocked due to SSOT update failure");
        process.exit(1);
      }
    }
  }

  isGitRepository() {
    try {
      execSync('git rev-parse --git-dir', { stdio: 'pipe' });
      return true;
    } catch (_error) {
      return false;
    }
  }

  isSSOTModified() {
    try {
      const result = execSync('git status --porcelain SSOT_DOCUMENTATION.md', { 
        stdio: 'pipe',
        encoding: 'utf8'
      });
      return result.trim().length > 0;
    } catch (_error) {
      return false;
    }
  }

  async hasArchitecturalChanges() {
    try {
      // Check for changes in key files
      const keyFiles = [
        'package.json',
        'CHANGELOG.md',
        'src/',
        'docs/',
        'scripts/'
      ];

      for (const file of keyFiles) {
        const result = execSync(`git diff --name-only HEAD ${file}`, { 
          stdio: 'pipe',
          encoding: 'utf8'
        });
        
        if (result.trim().length > 0) {
          return true;
        }
      }

      return false;
    } catch (_error) {
      return false;
    }
  }

  async updateSSOT() {
    try {
      await this.updater.run();
    } catch (error) {
      throw new Error(`Failed to update SSOT: ${error.message}`);
    }
  }

  stageSSOTFile() {
    try {
      execSync('git add SSOT_DOCUMENTATION.md', { stdio: 'pipe' });
      console.log("📁 SSOT file staged for commit");
    } catch (error) {
      console.warn("⚠️  Could not stage SSOT file:", error.message);
    }
  }

  // Run the updater
  static async main() {
    const updater = new PreCommitSSOTUpdater();
    await updater.run();
  }
}

// Run if called directly
if (require.main === module) {
  PreCommitSSOTUpdater.main().catch(error => {
    console.error("❌ Fatal error:", error.message);
    process.exit(1);
  });
}

module.exports = PreCommitSSOTUpdater;

