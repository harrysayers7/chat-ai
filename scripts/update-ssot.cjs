#!/usr/bin/env node
/**
 * SSOT Auto-Update Script
 * 
 * This script automatically updates the SSOT_DOCUMENTATION.md file when
 * important architectural changes are detected in the codebase.
 * 
 * It monitors:
 * - Package.json dependencies
 * - Project structure changes
 * - New features in changelog
 * - Configuration changes
 * - Script additions/modifications
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Configuration
const SSOT_FILE = "SSOT_DOCUMENTATION.md";
const PACKAGE_JSON = "package.json";
const CHANGELOG = "CHANGELOG.md";
const SCRIPTS_DIR = "scripts";
const SRC_DIR = "src";
const DOCS_DIR = "docs";

// Architectural change detection patterns
const ARCHITECTURE_PATTERNS = {
  dependencies: {
    major: /^\^?\d+\./,
    newPackage: /^\+.*"([^"]+)":/,
    removedPackage: /^-.*"([^"]+)":/
  },
  structure: {
    newDirectory: /^\+.*mkdir/,
    newFile: /^\+.*\.(ts|tsx|js|jsx|md|json)$/,
    removedFile: /^-.*\.(ts|tsx|js|jsx|md|json)$/
  },
  features: {
    newFeature: /^\* \*\*([^*]+)\*\*:/,
    breakingChange: /BREAKING CHANGE|breaking change/i
  }
};

class SSOTUpdater {
  constructor() {
    this.changes = [];
    this.lastUpdate = this.getLastUpdateTime();
  }

  getLastUpdateTime() {
    try {
      const stats = fs.statSync(SSOT_FILE);
      return stats.mtime;
    } catch (error) {
      return new Date(0);
    }
  }

  detectChanges() {
    console.log("🔍 Detecting architectural changes...");
    
    this.detectDependencyChanges();
    this.detectStructureChanges();
    this.detectFeatureChanges();
    this.detectScriptChanges();
    
    return this.changes.length > 0;
  }

  detectDependencyChanges() {
    try {
      const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
      const currentDeps = {
        dependencies: Object.keys(packageJson.dependencies || {}),
        devDependencies: Object.keys(packageJson.devDependencies || {})
      };

      // Check for new major versions or new packages
      for (const [type, deps] of Object.entries(currentDeps)) {
        for (const dep of deps) {
          const version = packageJson[type][dep];
          if (version && version.match(ARCHITECTURE_PATTERNS.dependencies.major)) {
            this.changes.push({
              type: 'dependency',
              category: type,
              package: dep,
              version: version,
              description: `Updated ${dep} to ${version}`
            });
          }
        }
      }
    } catch (error) {
      console.warn("⚠️  Could not analyze package.json:", error.message);
    }
  }

  detectStructureChanges() {
    try {
      // Check for new directories or significant files
      const newDirs = this.findNewDirectories();
      const newFiles = this.findNewFiles();
      
      newDirs.forEach(dir => {
        this.changes.push({
          type: 'structure',
          category: 'directory',
          path: dir,
          description: `New directory: ${dir}`
        });
      });

      newFiles.forEach(file => {
        if (this.isSignificantFile(file)) {
          this.changes.push({
            type: 'structure',
            category: 'file',
            path: file,
            description: `New significant file: ${file}`
          });
        }
      });
    } catch (error) {
      console.warn("⚠️  Could not analyze structure changes:", error.message);
    }
  }

  detectFeatureChanges() {
    try {
      const changelog = fs.readFileSync(CHANGELOG, 'utf8');
      const lines = changelog.split('\n');
      
      for (const line of lines) {
        if (line.match(ARCHITECTURE_PATTERNS.features.newFeature)) {
          const feature = line.match(ARCHITECTURE_PATTERNS.features.newFeature)[1];
          this.changes.push({
            type: 'feature',
            category: 'new',
            feature: feature,
            description: `New feature: ${feature}`
          });
        }
        
        if (line.match(ARCHITECTURE_PATTERNS.features.breakingChange)) {
          this.changes.push({
            type: 'feature',
            category: 'breaking',
            description: 'Breaking change detected'
          });
        }
      }
    } catch (error) {
      console.warn("⚠️  Could not analyze changelog:", error.message);
    }
  }

  detectScriptChanges() {
    try {
      const scripts = fs.readdirSync(SCRIPTS_DIR);
      const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
      const packageScripts = packageJson.scripts || {};
      
      // Check for new scripts
      for (const script of scripts) {
        if (script.endsWith('.cjs') || script.endsWith('.ts') || script.endsWith('.sh')) {
          const scriptName = path.basename(script, path.extname(script));
          if (!packageScripts[scriptName] && !packageScripts[scriptName.replace(/-/g, ':')]) {
            this.changes.push({
              type: 'script',
              category: 'new',
              script: script,
              description: `New script: ${script}`
            });
          }
        }
      }
    } catch (error) {
      console.warn("⚠️  Could not analyze script changes:", error.message);
    }
  }

  findNewDirectories() {
    const newDirs = [];
    const dirsToCheck = [SRC_DIR, DOCS_DIR, SCRIPTS_DIR];
    
    for (const dir of dirsToCheck) {
      if (fs.existsSync(dir)) {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
          if (item.isDirectory() && !item.name.startsWith('.')) {
            const fullPath = path.join(dir, item.name);
            const stats = fs.statSync(fullPath);
            if (stats.mtime > this.lastUpdate) {
              newDirs.push(fullPath);
            }
          }
        }
      }
    }
    
    return newDirs;
  }

  findNewFiles() {
    const newFiles = [];
    const dirsToCheck = [SRC_DIR, DOCS_DIR, SCRIPTS_DIR];
    
    for (const dir of dirsToCheck) {
      if (fs.existsSync(dir)) {
        this.walkDirectory(dir, newFiles);
      }
    }
    
    return newFiles;
  }

  walkDirectory(dir, newFiles) {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      if (item.name.startsWith('.') || item.name === 'node_modules') continue;
      
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
        this.walkDirectory(fullPath, newFiles);
      } else if (item.isFile()) {
        const stats = fs.statSync(fullPath);
        if (stats.mtime > this.lastUpdate) {
          newFiles.push(fullPath);
        }
      }
    }
  }

  isSignificantFile(filePath) {
    const significantPatterns = [
      /\.(ts|tsx|js|jsx)$/,
      /\.(md|mdx)$/,
      /\.(json|yaml|yml)$/,
      /\.(sh|bash)$/
    ];
    
    const fileName = path.basename(filePath);
    const isSignificant = significantPatterns.some(pattern => pattern.test(filePath));
    const isNotGenerated = !fileName.includes('.generated') && !fileName.includes('.min');
    
    return isSignificant && isNotGenerated;
  }

  updateSSOT() {
    if (this.changes.length === 0) {
      console.log("✅ No architectural changes detected. SSOT is up to date.");
      return;
    }

    console.log(`🔄 Updating SSOT with ${this.changes.length} detected changes...`);
    
    try {
      let ssotContent = fs.readFileSync(SSOT_FILE, 'utf8');
      
      // Update version and last updated
      const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      ssotContent = ssotContent.replace(
        /> \*\*Last Updated\*\*: .*</,
        `> **Last Updated**: ${currentDate}`
      );
      
      // Add change summary section
      const changeSummary = this.generateChangeSummary();
      const changeSection = `\n## 🔄 **Recent Architectural Changes (Auto-detected)**

${changeSummary}

> **Note**: This section is automatically updated when significant changes are detected in the codebase.

---\n`;
      
      // Insert after the main header
      const headerEnd = ssotContent.indexOf('---', ssotContent.indexOf('---') + 3);
      if (headerEnd !== -1) {
        ssotContent = ssotContent.slice(0, headerEnd + 3) + changeSection + ssotContent.slice(headerEnd + 3);
      }
      
      // Write updated content
      fs.writeFileSync(SSOT_FILE, ssotContent);
      
      console.log("✅ SSOT document updated successfully!");
      console.log(`📝 Added ${this.changes.length} detected changes`);
      
      // Stage the updated file
      try {
        execSync(`git add ${SSOT_FILE}`, { stdio: 'pipe' });
        console.log("📁 Updated SSOT staged for commit");
      } catch (error) {
        console.log("ℹ️  File staged (not in git repository)");
      }
      
    } catch (error) {
      console.error("❌ Failed to update SSOT:", error.message);
      process.exit(1);
    }
  }

  generateChangeSummary() {
    const summaries = [];
    
    // Group changes by type
    const grouped = this.changes.reduce((acc, change) => {
      if (!acc[change.type]) acc[change.type] = [];
      acc[change.type].push(change);
      return acc;
    }, {});
    
    for (const [type, changes] of Object.entries(grouped)) {
      summaries.push(`### **${this.capitalizeFirst(type)} Changes**`);
      
      for (const change of changes) {
        summaries.push(`- ${change.description}`);
      }
      
      summaries.push('');
    }
    
    return summaries.join('\n');
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  run() {
    console.log("🚀 SSOT Auto-Update Script");
    console.log("============================\n");
    
    if (this.detectChanges()) {
      console.log(`📊 Detected ${this.changes.length} architectural changes:`);
      this.changes.forEach((change, index) => {
        console.log(`  ${index + 1}. ${change.description}`);
      });
      console.log();
      
      this.updateSSOT();
    } else {
      console.log("✅ No architectural changes detected.");
    }
    
    console.log("\n🎯 SSOT update complete!");
  }
}

// Run the updater
if (require.main === module) {
  const updater = new SSOTUpdater();
  updater.run();
}

module.exports = SSOTUpdater;

