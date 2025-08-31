#!/usr/bin/env node
/**
 * Intelligent SSOT Auto-Update Script
 * 
 * This script intelligently updates the SSOT_DOCUMENTATION.md file by:
 * - Detecting architectural changes in the codebase
 * - Parsing the current SSOT content
 * - Updating relevant sections with new information
 * - Maintaining document structure and formatting
 * - Adding new sections when needed
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

class IntelligentSSOTUpdater {
  constructor() {
    this.changes = [];
    this.lastUpdate = this.getLastUpdateTime();
    this.currentContent = "";
    this.sections = {};
  }

  getLastUpdateTime() {
    try {
      const stats = fs.statSync(SSOT_FILE);
      return stats.mtime;
    } catch (error) {
      return new Date(0);
    }
  }

  loadCurrentSSOT() {
    try {
      this.currentContent = fs.readFileSync(SSOT_FILE, 'utf8');
      this.parseSections();
    } catch (error) {
      console.error("❌ Could not load current SSOT:", error.message);
      process.exit(1);
    }
  }

  parseSections() {
    const lines = this.currentContent.split('\n');
    let currentSection = '';
    let currentContent = [];
    
    for (const line of lines) {
      if (line.startsWith('## ')) {
        if (currentSection) {
          this.sections[currentSection] = currentContent.join('\n').trim();
        }
        currentSection = line.replace('## ', '').replace('**', '').replace('**', '').trim();
        currentContent = [];
      } else if (currentSection) {
        currentContent.push(line);
      }
    }
    
    if (currentSection) {
      this.sections[currentSection] = currentContent.join('\n').trim();
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
        dependencies: packageJson.dependencies || {},
        devDependencies: packageJson.devDependencies || {}
      };

      // Check for new packages or major version updates
      for (const [type, deps] of Object.entries(currentDeps)) {
        for (const [dep, version] of Object.entries(deps)) {
          if (version && typeof version === 'string') {
            // Check if this is a new major version or new package
            const majorVersion = version.match(/^(\^?)(\d+)\./);
            if (majorVersion) {
              this.changes.push({
                type: 'dependency',
                category: type,
                package: dep,
                version: version,
                description: `Updated ${dep} to ${version}`,
                action: 'update_version'
              });
            }
          }
        }
      }
    } catch (error) {
      console.warn("⚠️  Could not analyze package.json:", error.message);
    }
  }

  detectStructureChanges() {
    try {
      // Check for new directories
      const newDirs = this.findNewDirectories();
      newDirs.forEach(dir => {
        this.changes.push({
          type: 'structure',
          category: 'directory',
          path: dir,
          description: `New directory: ${dir}`,
          action: 'add_directory'
        });
      });

      // Check for new significant files
      const newFiles = this.findNewFiles();
      newFiles.forEach(file => {
        if (this.isSignificantFile(file)) {
          this.changes.push({
            type: 'structure',
            category: 'file',
            path: file,
            description: `New significant file: ${file}`,
            action: 'add_file'
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
        // Look for new features
        const featureMatch = line.match(/^\* \*\*([^*]+)\*\*:/);
        if (featureMatch) {
          const feature = featureMatch[1];
          this.changes.push({
            type: 'feature',
            category: 'new',
            feature: feature,
            description: `New feature: ${feature}`,
            action: 'add_feature'
          });
        }
        
        // Look for breaking changes
        if (line.match(/BREAKING CHANGE|breaking change/i)) {
          this.changes.push({
            type: 'feature',
            category: 'breaking',
            description: 'Breaking change detected',
            action: 'add_breaking_change'
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
      
      for (const script of scripts) {
        if (script.endsWith('.cjs') || script.endsWith('.ts') || script.endsWith('.sh')) {
          const scriptName = path.basename(script, path.extname(script));
          const normalizedName = scriptName.replace(/-/g, ':');
          
          if (!packageScripts[scriptName] && !packageScripts[normalizedName]) {
            this.changes.push({
              type: 'script',
              category: 'new',
              script: script,
              description: `New script: ${script}`,
              action: 'add_script'
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
      let updatedContent = this.currentContent;
      
      // Update version and last updated
      const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      updatedContent = updatedContent.replace(
        /> \*\*Last Updated\*\*: .*</,
        `> **Last Updated**: ${currentDate}`
      );
      
      // Apply intelligent updates based on change types
      updatedContent = this.applyIntelligentUpdates(updatedContent);
      
      // Add change summary section if it doesn't exist
      if (!updatedContent.includes('## 🔄 **Recent Architectural Changes')) {
        updatedContent = this.addChangeSummarySection(updatedContent);
      } else {
        updatedContent = this.updateChangeSummarySection(updatedContent);
      }
      
      // Write updated content
      fs.writeFileSync(SSOT_FILE, updatedContent);
      
      console.log("✅ SSOT document updated successfully!");
      console.log(`📝 Applied ${this.changes.length} intelligent updates`);
      
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

  applyIntelligentUpdates(content) {
    let updatedContent = content;
    
    for (const change of this.changes) {
      switch (change.action) {
        case 'add_feature':
          updatedContent = this.addFeatureToRoadmap(updatedContent, change);
          break;
        case 'add_script':
          updatedContent = this.addScriptToDevelopmentSection(updatedContent, change);
          break;
        case 'add_directory':
          updatedContent = this.addDirectoryToProjectStructure(updatedContent, change);
          break;
        case 'update_version':
          updatedContent = this.updateVersionInTechStack(updatedContent, change);
          break;
      }
    }
    
    return updatedContent;
  }

  addFeatureToRoadmap(content, change) {
    const roadmapSection = content.indexOf('## 🗺️ **Roadmap & Future Features**');
    if (roadmapSection !== -1) {
      const plannedFeaturesStart = content.indexOf('### **Planned Features**', roadmapSection);
      if (plannedFeaturesStart !== -1) {
        const insertPoint = content.indexOf('\n', plannedFeaturesStart);
        const newFeature = `\n- [ ] **${change.feature}**`;
        content = content.slice(0, insertPoint) + newFeature + content.slice(insertPoint);
      }
    }
    return content;
  }

  addScriptToDevelopmentSection(content, change) {
    const devSection = content.indexOf('## 🔧 **Development Workflow**');
    if (devSection !== -1) {
      const scriptsStart = content.indexOf('### **Available Scripts**', devSection);
      if (scriptsStart !== -1) {
        const insertPoint = content.indexOf('\n', scriptsStart);
        const newScript = `\n# ${change.script}              # New script added`;
        content = content.slice(0, insertPoint) + newScript + content.slice(insertPoint);
      }
    }
    return content;
  }

  addDirectoryToProjectStructure(content, change) {
    const structureSection = content.indexOf('## 🗂️ **Project Structure**');
    if (structureSection !== -1) {
      const codeBlockStart = content.indexOf('```', structureSection);
      if (codeBlockStart !== -1) {
        const codeBlockEnd = content.indexOf('```', codeBlockStart + 3);
        if (codeBlockEnd !== -1) {
          const codeBlock = content.slice(codeBlockStart + 3, codeBlockEnd);
          const newDir = `\n├── ${change.path.split('/').pop()}/          # New directory`;
          
          // Find appropriate insertion point in the tree structure
          const lines = codeBlock.split('\n');
          let insertIndex = lines.length - 1;
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('└──') && !lines[i + 1]?.includes('└──')) {
              insertIndex = i;
              break;
            }
          }
          
          lines.splice(insertIndex, 0, newDir);
          const updatedCodeBlock = lines.join('\n');
          content = content.slice(0, codeBlockStart + 3) + updatedCodeBlock + content.slice(codeBlockEnd);
        }
      }
    }
    return content;
  }

  updateVersionInTechStack(content, change) {
    // Update version numbers in the tech stack section
    const techSection = content.indexOf('## 🏗️ **Architecture & Technology Stack**');
    if (techSection !== -1) {
      const packageName = change.package.replace('@', '');
      const versionPattern = new RegExp(`(${packageName}[^\\d]*)(\\d+\\.\\d+\\.\\d+)`, 'g');
      content = content.replace(versionPattern, `$1${change.version.split('^')[1] || change.version}`);
    }
    return content;
  }

  addChangeSummarySection(content) {
    const changeSummary = this.generateChangeSummary();
    const changeSection = `\n## 🔄 **Recent Architectural Changes (Auto-detected)**

${changeSummary}

> **Note**: This section is automatically updated when significant changes are detected in the codebase.

---\n`;
    
    // Insert after the main header
    const headerEnd = content.indexOf('---', content.indexOf('---') + 3);
    if (headerEnd !== -1) {
      content = content.slice(0, headerEnd + 3) + changeSection + content.slice(headerEnd + 3);
    }
    
    return content;
  }

  updateChangeSummarySection(content) {
    const changeSummary = this.generateChangeSummary();
    const sectionStart = content.indexOf('## 🔄 **Recent Architectural Changes');
    const sectionEnd = content.indexOf('---', sectionStart);
    
    if (sectionStart !== -1 && sectionEnd !== -1) {
      const newSection = `## 🔄 **Recent Architectural Changes (Auto-detected)**

${changeSummary}

> **Note**: This section is automatically updated when significant changes are detected in the codebase.

---`;
      
      content = content.slice(0, sectionStart) + newSection + content.slice(sectionEnd);
    }
    
    return content;
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
    console.log("🚀 Intelligent SSOT Auto-Update Script");
    console.log("=======================================\n");
    
    this.loadCurrentSSOT();
    
    if (this.detectChanges()) {
      console.log(`📊 Detected ${this.changes.length} architectural changes:`);
      this.changes.forEach((change, index) => {
        console.log(`  ${index + 1}. ${change.description} (${change.action})`);
      });
      console.log();
      
      this.updateSSOT();
    } else {
      console.log("✅ No architectural changes detected.");
    }
    
    console.log("\n🎯 Intelligent SSOT update complete!");
  }
}

// Run the updater
if (require.main === module) {
  const updater = new IntelligentSSOTUpdater();
  updater.run();
}

module.exports = IntelligentSSOTUpdater;

