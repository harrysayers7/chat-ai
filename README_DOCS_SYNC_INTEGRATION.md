# 🚀 Docs Sync Integration for Chat-UI

This integration allows you to create AI agents in chat-ui using live documentation from your **chat-gpt-brain** repository via the Docs Sync API.

## 🎯 **What This Does**

Instead of manually copying and pasting documentation into agent instructions, this integration:

- **Fetches live documentation** from your Docs Sync API
- **Automatically updates** when your docs change
- **Optimizes for custom GPTs** by focusing on priority documentation
- **Leverages your existing infrastructure** (no duplicate GitHub API calls)

## 🚀 **Quick Start**

### 1. **Test Your Connection**

First, make sure your Docs Sync API is working:

```bash
npm run docs-sync:setup
```

This will test the connection to your API and show you what documentation is available.

### 2. **Create an Agent with Docs Sync**

1. **Navigate to** `/agent/new` in your chat-ui
2. **Click** "Use Docs Sync" 
3. **Configure** your API base URL (defaults to your ngrok tunnel)
4. **Click** "Fetch Custom GPT Prompts"
5. **Review** the fetched documentation
6. **Create** your agent with live prompts!

## 🔧 **How It Works**

### **Architecture**

```
chat-ui → /api/docs-sync → Your Docs Sync API → GitHub → Live Documentation
```

### **Key Features**

- **ETag Caching**: Uses your built-in caching system
- **Health Monitoring**: Checks API status before fetching
- **Custom GPT Mode**: Optimized for your use case
- **Live Updates**: Always gets the latest documentation
- **Error Handling**: Graceful fallbacks and user feedback

### **API Endpoints Used**

- `GET /health` - Check API status
- `GET /docs-sync/tree` - List available documentation
- `GET /docs-sync/file` - Fetch specific files
- `GET /debug/cache` - Debug caching issues

## 📁 **Documentation Structure**

The integration is optimized for your `docs/` folder structure:

```
docs/
├── 00-README.md          # 📖 Overview
├── 01-foundations.md     # 🏗️ Core concepts
├── 02-governance.md      # 🛡️ Rules and policies
├── 03-security.md        # 🔒 Security guidelines
├── 04-tools.md           # 🛠️ Available tools
├── 05-style.md           # 🎨 Style guide
├── 06-commands.md        # ⌨️ Command reference
└── 07-knowledge-architecture.md # 🧠 Knowledge structure
```

## ⚙️ **Configuration**

### **Environment Variables**

No additional environment variables needed! The integration uses your existing Docs Sync API.

### **Base URL Configuration**

- **Development**: Your ngrok tunnel (e.g., `https://1d4683e0c425.ngrok-free.app`)
- **Production**: Your production Docs Sync API URL

## 🎨 **Customization Options**

### **Custom GPT Mode**

When enabled, the integration:
- Fetches from priority documentation files
- Limits content to prevent overwhelming the AI
- Focuses on the most important prompts

### **Metadata Inclusion**

When enabled, shows:
- Available files count
- Cache statistics
- API health information
- Branch and prefix details

## 🔍 **Troubleshooting**

### **Common Issues**

1. **API Not Accessible**
   - Check if your Docs Sync API is running
   - Verify the base URL is correct
   - Check firewall/network settings

2. **No Documentation Found**
   - Ensure your `docs/` folder has content
   - Check the API logs for errors
   - Verify GitHub API connectivity

3. **Caching Issues**
   - Use the debug endpoint to check cache status
   - Clear cache if needed
   - Check ETag headers

### **Debug Commands**

```bash
# Test connection
npm run docs-sync:setup

# Test with custom URL
npm run docs-sync:setup -- --url https://your-api.com
```

## 📚 **Example Usage**

### **Creating a Custom GPT Agent**

1. **Fetch Prompts**: Gets live documentation from your API
2. **Review Content**: See exactly what will be used
3. **Configure Agent**: Set name, description, and role
4. **Create Agent**: Agent is created with live prompts
5. **Use in Chat**: Agent automatically has latest documentation

### **Updating Documentation**

1. **Edit files** in your `chat-gpt-brain` repository
2. **Push changes** to GitHub
3. **Docs Sync API** automatically updates
4. **Your agents** get fresh content on next fetch

## 🔄 **Integration Points**

### **With Chat-UI**

- **Agent Creation**: `/agent/new` → "Use Docs Sync"
- **Agent Management**: Existing agent management system
- **Chat Interface**: Agents work in all existing chat contexts

### **With Your Workflow**

- **Documentation Updates**: Push to GitHub → Live in chat-ui
- **Agent Updates**: Re-fetch prompts to update existing agents
- **Version Control**: All changes tracked in your repository

## 🎉 **Benefits**

1. **No Manual Copy/Paste**: Documentation automatically syncs
2. **Always Up-to-Date**: Latest changes immediately available
3. **Efficient**: Uses your existing Docs Sync API
4. **Scalable**: Works with any number of agents
5. **Maintainable**: Single source of truth for documentation

## 🚀 **Next Steps**

1. **Test the integration** with `npm run docs-sync:setup`
2. **Create your first agent** using Docs Sync
3. **Customize the documentation** structure if needed
4. **Deploy to production** when ready

---

**Need help?** Check the troubleshooting section or run the setup script for diagnostics.


