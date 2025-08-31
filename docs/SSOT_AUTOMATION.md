# 🔄 SSOT Automation System

The Chat-AI project now features **fully automatic SSOT document updates**! The system will keep your Single Source of Truth documentation current without any manual intervention.

## 🎯 **How It Works**

### **1. Development Watcher (Real-time)**
- **Command**: `pnpm ssot:watch`
- **What it does**: Monitors the codebase for architectural changes
- **When it runs**: Automatically during development sessions
- **Updates**: SSOT in real-time as you code

### **2. Pre-commit Hook (Before commits)**
- **Trigger**: Automatically runs before every `git commit`
- **What it does**: Updates SSOT and stages it for commit
- **Result**: SSOT is always current when you commit

### **3. Manual Updates (On-demand)**
- **Command**: `pnpm ssot:update`
- **What it does**: Runs intelligent analysis and updates SSOT
- **Use case**: When you want to manually trigger an update

## 🚀 **Getting Started**

### **Start Development Watcher**
```bash
# Start the automatic watcher (recommended for active development)
pnpm ssot:watch

# Or run manually
node scripts/watch-ssot.cjs
```

### **Manual Updates**
```bash
# Full intelligent update
pnpm ssot:update

# Basic update check
pnpm ssot:check
```

## 🔄 **Automatic Triggers**

| Action | What Happens | When |
|--------|--------------|------|
| **File Change** | SSOT updates in real-time | During development |
| **Git Commit** | SSOT updates before commit | Pre-commit hook |
| **New Dependencies** | Tech stack section updates | Package.json changes |
| **New Features** | Roadmap section updates | Changelog additions |
| **New Scripts** | Development workflow updates | Script additions |
| **New Directories** | Project structure updates | Directory creation |

## 📁 **What Gets Monitored**

The system automatically monitors:
- `package.json` - Dependencies and scripts
- `CHANGELOG.md` - New features and breaking changes
- `src/` - Source code structure and changes
- `docs/` - Documentation updates
- `scripts/` - New automation scripts
- `*.config.*` - Configuration file changes

## 🧠 **Intelligent Updates**

The system doesn't just add a summary - it intelligently updates the actual content:

### **Dependency Changes**
- Updates version numbers in tech stack section
- Adds new packages to relevant sections
- Removes deprecated packages

### **Feature Changes**
- Adds new features to roadmap section
- Updates feature descriptions
- Marks completed features

### **Structural Changes**
- Updates project structure tree
- Adds new directories and files
- Maintains proper formatting

### **Script Changes**
- Adds new scripts to development workflow
- Updates command descriptions
- Maintains script organization

## 🛠️ **Available Commands**

### **Core Commands**
```bash
pnpm ssot:update      # Run intelligent SSOT update
pnpm ssot:watch       # Start development watcher
pnpm ssot:check       # Basic update check
```

### **Advanced Commands**
```bash
# Direct script execution
node scripts/intelligent-ssot-updater.cjs
node scripts/watch-ssot.cjs
node scripts/pre-commit-ssot.cjs
```

## 🔧 **Configuration**

### **Customizing Watch Patterns**
Edit `scripts/watch-ssot.cjs` to modify which files are monitored:

```javascript
const WATCH_PATTERNS = [
  "package.json",
  "CHANGELOG.md",
  "src/**/*",
  "docs/**/*",
  "scripts/**/*",
  "*.config.*",
  "*.json"
  // Add your custom patterns here
];
```

### **Customizing Ignore Patterns**
```javascript
const IGNORE_PATTERNS = [
  "node_modules/**",
  ".git/**",
  ".next/**",
  "dist/**",
  "build/**",
  "coverage/**",
  "*.log",
  "*.tmp"
  // Add your custom ignore patterns here
];
```

## 🎉 **Benefits**

✅ **Zero Maintenance** - SSOT updates automatically  
✅ **Real-time Updates** - No waiting for commits  
✅ **Always Current** - Documentation reflects latest code  
✅ **Intelligent Updates** - Content changes, not just summaries  
✅ **Git Integration** - Automatic staging and commits  
✅ **Development Focused** - Updates while you code  

## 🛠️ **Troubleshooting**

### **Watcher Not Starting**
```bash
# Check if Node.js is running
node --version

# Ensure you're in the project root
pwd

# Try manual start
node scripts/watch-ssot.cjs
```

### **Git Hooks Not Working**
```bash
# Reinstall husky
pnpm prepare

# Check hook permissions
ls -la .husky/

# Verify pre-commit hook
cat .husky/pre-commit
```

### **SSOT Not Updating**
```bash
# Force manual update
pnpm ssot:update

# Check file permissions
ls -la scripts/

# Verify SSOT file exists
ls -la SSOT_DOCUMENTATION.md
```

### **Permission Issues**
```bash
# Make scripts executable
chmod +x scripts/*.cjs
chmod +x scripts/*.sh

# Check file ownership
ls -la scripts/
```

## 🔧 **Advanced Configuration**

### **Custom Update Logic**
Edit `scripts/intelligent-ssot-updater.cjs` to customize:
- Change detection patterns
- Update strategies
- Content modification rules

### **Custom Watcher Behavior**
Edit `scripts/watch-ssot.cjs` to modify:
- Debounce timing
- File filtering
- Event handling

### **Custom Git Hooks**
Edit `.husky/` files to customize:
- When updates run
- What gets updated
- Error handling

## 🎯 **Best Practices**

1. **Start the watcher** when beginning development sessions
2. **Let it run** in the background while coding
3. **Commit regularly** to trigger pre-commit updates
4. **Review updates** before major commits
5. **Customize patterns** for your specific needs

## 🔄 **Integration with Existing Systems**

### **Cursor Rules System**
The SSOT automation works alongside the existing Cursor rules system:
- Both update automatically before commits
- Both use similar file watching patterns
- Both integrate with Husky hooks

### **CI/CD Pipeline**
The system is designed to work with CI/CD:
- Pre-commit hooks ensure updates
- Git staging handles file management
- Error handling prevents broken commits

## 📚 **File Structure**

```
scripts/
├── intelligent-ssot-updater.cjs    # Main intelligent updater
├── watch-ssot.cjs                  # Development watcher
├── pre-commit-ssot.cjs            # Git hook integration
└── update-ssot.cjs                # Basic updater (legacy)

.husky/
└── pre-commit                     # Git hook configuration

docs/
└── SSOT_AUTOMATION.md             # This documentation
```

## 🚀 **Getting Help**

### **Common Issues**
- **File not found**: Ensure you're in the project root
- **Permission denied**: Check file permissions and ownership
- **Git hooks not working**: Verify Husky installation and configuration

### **Debug Mode**
```bash
# Run with verbose logging
DEBUG=* node scripts/watch-ssot.cjs

# Check specific script
node scripts/intelligent-ssot-updater.cjs
```

### **Support**
- **GitHub Issues**: Report bugs and feature requests
- **Discord**: Get help from the community
- **Documentation**: Check this guide and project README

---

**🎉 You're all set!** The SSOT automation system will now automatically keep your documentation current with zero manual intervention.

**Next Steps:**
1. Start the watcher: `pnpm ssot:watch`
2. Make some changes to test the system
3. Commit to see the pre-commit hook in action
4. Customize patterns and behavior as needed

The system is designed to be intelligent, reliable, and completely hands-off once configured!

