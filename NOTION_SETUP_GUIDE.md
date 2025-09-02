# 🔧 Notion MCP Server Setup Guide

## Issue: Notion Database Not Loading in Sidebar

The Notion integration requires a properly configured MCP server. Here's how to set it up:

## Step 1: Check Current MCP Servers

1. **Open Browser Dev Tools** (F12)
2. **Go to Console tab**
3. **Navigate to the Notion tab** in the right sidebar
4. **Look for console logs** showing:
   - "Fetching MCP servers..."
   - "MCP servers response: [...]"
   - "All MCP servers: [...]"

## Step 2: Configure Notion MCP Server

### Option A: Use Your Existing Custom Server

If you want to use your existing `custom-mcp-server/notion-tasks.ts`:

1. **Navigate to MCP Settings** in your app
2. **Add New MCP Server** with:
   - **Name**: `notion-tasks` (or any name containing "notion" or "task")
   - **Type**: Stdio
   - **Configuration**:
   ```json
   {
     "command": "npx",
     "args": ["tsx", "custom-mcp-server/notion-tasks.ts"]
   }
   ```

### Option B: Use a Real Notion API Server

1. **Get Notion API Key**:
   - Go to https://www.notion.so/my-integrations
   - Create a new integration
   - Copy the Internal Integration Token

2. **Add MCP Server** with:
   - **Name**: `notion-api`
   - **Type**: HTTP
   - **Configuration**:
   ```json
   {
     "url": "https://api.notion.com/v1",
     "headers": {
       "Authorization": "Bearer YOUR_NOTION_TOKEN",
       "Notion-Version": "2022-06-28"
     }
   }
   ```

## Step 3: Test the Setup

1. **Check Debug Info** in the Notion tab:
   - Server ID should show a UUID
   - Error should be "None"
   - Click "Test Fetch" button

2. **Check Console Logs**:
   - Should see "Found Notion MCP server: {...}"
   - Should see "Fetching databases from server: [server-id]"
   - Should see "list_databases result: {...}"

## Step 4: Troubleshooting

### If "Server ID: Not found":
- No MCP server with "notion" or "task" in the name
- Check MCP server configuration
- Ensure server is enabled

### If "Error: Failed to load MCP servers":
- Check network connectivity
- Verify `/api/mcp/list` endpoint is working
- Check server logs

### If "Error: Notion MCP server not configured":
- Server found but not properly initialized
- Check server status in MCP dashboard
- Try refreshing the MCP server

### If "Error: Failed to parse databases":
- Server responding but with unexpected format
- Check server implementation
- Verify tool is working correctly

## Step 5: Verify Tools Available

The Notion MCP server should provide these tools:
- `list_databases` - List available Notion databases
- `get_tasks` - Fetch tasks from a database
- `create_task` - Create new tasks
- `update_task` - Update existing tasks

## Quick Test

Run this in browser console to test the MCP API directly:

```javascript
fetch('/api/mcp/list')
  .then(r => r.json())
  .then(console.log);
```

This should return an array of MCP servers. Look for one with "notion" or "task" in the name.

## Need Help?

1. Check the debug info in the Notion tab
2. Look at console logs for detailed error messages
3. Verify MCP server is running and accessible
4. Test the MCP tools individually in the MCP dashboard



