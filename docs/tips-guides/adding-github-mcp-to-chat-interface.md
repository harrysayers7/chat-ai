# Adding GitHub MCP to Chat-AI Interface

**Last Updated**: 2025-01-27 14:30:00 UTC

## 🎯 Overview

This guide shows you how to add the GitHub MCP server to the chat-ai chatbot interface so users can interact with GitHub repositories directly through the chat interface.

## 🔧 Prerequisites

1. **GitHub Token**: You need a GitHub Personal Access Token
2. **MCP Configuration**: The GitHub MCP server is already configured in `.mcp-config.json`
3. **Development Server**: The chat-ai application should be running

## 📋 Step-by-Step Guide

### Step 1: Set Up GitHub Token

1. **Get a GitHub Token**:
   - Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
   - Click "Generate new token (classic)"
   - Select scopes: `repo`, `read:org`, `read:user`
   - Copy the token

2. **Set Environment Variable**:
   ```bash
   export GITHUB_TOKEN=your_github_token_here
   ```

3. **Add to .env file** (for permanent storage):
   ```bash
   echo "GITHUB_TOKEN=your_github_token_here" >> .env
   ```

### Step 2: Verify MCP Configuration

The GitHub MCP server is already configured in `.mcp-config.json`:

```json
{
  "notion-mcp-server": {
    "url": "http://134.199.159.190:3000/mcp",
    "headers": {
      "Authorization": "Bearer notion-mcp-token-2025",
      "Accept": "application/json, text/event-stream",
      "Content-Type": "application/json"
    }
  },
  "github-mcp": {
    "command": "npx",
    "args": ["@modelcontextprotocol/server-github@latest"],
    "env": {
      "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
    }
  }
}
```

### Step 3: Start the Development Server

1. **Install Dependencies** (if not already done):
   ```bash
   pnpm install
   ```

2. **Start the Development Server**:
   ```bash
   pnpm dev
   ```

3. **Verify Server is Running**:
   - Open http://localhost:3000
   - Navigate to the MCP dashboard at http://localhost:3000/mcp

### Step 4: Enable GitHub MCP in the Interface

#### Option A: Through MCP Dashboard (Recommended)

1. **Navigate to MCP Dashboard**:
   - Go to http://localhost:3000/mcp
   - You should see the GitHub MCP server listed

2. **Enable the GitHub MCP Server**:
   - Click on the GitHub MCP server card
   - The server should show as "connected" status
   - If it shows "authorizing", click to authorize

3. **Verify Tools are Available**:
   - The GitHub MCP server should show available tools
   - You should see tools like `mcp_github_search_repositories`, `mcp_github_get_file_contents`, etc.

#### Option B: Through Chat Interface

1. **Open Chat Interface**:
   - Go to http://localhost:3000/chat
   - Start a new chat or open an existing one

2. **Access Tool Selection**:
   - Click the tool selection dropdown (usually in the chat input area)
   - Look for "MCP Servers" section
   - Find "github-mcp" in the list

3. **Enable GitHub Tools**:
   - Toggle on the GitHub MCP server
   - Select specific tools you want to use
   - Or enable all GitHub tools

### Step 5: Use GitHub MCP Tools in Chat

#### Method 1: Tool Mentions

Type `@` in the chat input and you'll see available GitHub tools:

```
@mcp_github_search_repositories
@mcp_github_get_file_contents
@mcp_github_list_issues
@mcp_github_create_issue
```

#### Method 2: Direct Commands

You can ask the AI to use GitHub tools:

```
"Search for repositories containing 'chat-ai'"
"Get the contents of README.md from my repository"
"List recent commits from the main branch"
"Create a new issue with title 'Bug Report'"
```

#### Method 3: Tool Presets

Create tool presets for common GitHub workflows:

1. **Repository Management Preset**:
   - `mcp_github_get_file_contents`
   - `mcp_github_create_or_update_file`
   - `mcp_github_list_commits`
   - `mcp_github_create_branch`

2. **Issue Tracking Preset**:
   - `mcp_github_list_issues`
   - `mcp_github_create_issue`
   - `mcp_github_update_issue`
   - `mcp_github_add_issue_comment`

## 🎨 User Interface Integration

### Chat Input Integration

The GitHub MCP tools are integrated into the chat interface through:

1. **Tool Selection Dropdown**: Users can select which GitHub tools to enable
2. **Mention System**: Users can type `@` to see and select GitHub tools
3. **Tool Presets**: Pre-configured sets of GitHub tools for common workflows

### Available UI Components

- **MCP Dashboard** (`/mcp`): Manage and configure MCP servers
- **Tool Select Dropdown**: Enable/disable specific tools
- **Chat Mention Input**: Quick access to tools via `@` mentions
- **Tool Presets**: Pre-configured tool combinations

## 🔍 Verification Steps

### 1. Check MCP Server Status

Visit http://localhost:3000/api/mcp/list to see all MCP servers:

```bash
curl -s http://localhost:3000/api/mcp/list | jq '.[] | select(.name | contains("github"))'
```

### 2. Test GitHub Tools

Try these commands in the chat interface:

```
"Search for my repositories"
"List recent commits from the main branch"
"Get the contents of package.json"
```

### 3. Check Tool Availability

In the chat interface:
1. Type `@` to see available tools
2. Look for `mcp_github_*` tools
3. Verify tools are enabled and functional

## 🚨 Troubleshooting

### Common Issues

**"GitHub MCP server not showing"**
- Check if `GITHUB_TOKEN` is set correctly
- Verify the development server is running
- Check browser console for errors

**"Tools not available in chat"**
- Ensure GitHub MCP server is enabled in MCP dashboard
- Check if tools are selected in the tool dropdown
- Verify the server status is "connected"

**"Authentication errors"**
- Verify GitHub token has correct scopes
- Check if token is expired
- Ensure token has access to the repositories you're trying to access

**"Rate limit errors"**
- GitHub API has rate limits (5,000 requests/hour)
- Wait for rate limit to reset
- Reduce frequency of API calls

### Debug Steps

1. **Check Server Logs**:
   ```bash
   # Look for MCP-related logs in the development server output
   ```

2. **Verify Environment Variables**:
   ```bash
   echo $GITHUB_TOKEN
   ```

3. **Test MCP API**:
   ```bash
   curl -s http://localhost:3000/api/mcp/list | jq '.'
   ```

4. **Check Browser Network Tab**:
   - Open browser developer tools
   - Look for failed requests to `/api/mcp/*` endpoints

## 🎯 Usage Examples

### Repository Management
```
"Search for repositories containing 'react'"
"Get the contents of src/App.tsx from my repository"
"List all branches in my repository"
"Create a new branch called 'feature/new-feature'"
```

### Issue Management
```
"List open issues in my repository"
"Create a new issue with title 'Bug Report' and description 'Found a bug in the login system'"
"Add a comment to issue #123 explaining the fix"
"Update issue #456 status to closed"
```

### Code Search
```
"Search for code containing 'useState' in my repository"
"Find all files with 'component' in the name"
"Search for TODO comments in my codebase"
```

### File Operations
```
"Get the contents of package.json"
"Create a new file called CHANGELOG.md with version history"
"Update the README.md file with new installation instructions"
"Delete the old config file"
```

## 🔒 Security Considerations

### Token Security
- Never commit GitHub tokens to version control
- Use environment variables for token storage
- Rotate tokens regularly (every 90 days)
- Use tokens with minimal required scopes

### Access Control
- GitHub MCP tools respect repository permissions
- Private repositories require proper token scopes
- Users can only access repositories they have permission for

### Rate Limiting
- GitHub API has rate limits (5,000 requests/hour for authenticated users)
- The system implements automatic backoff for rate limit errors
- Monitor usage to avoid hitting limits

## 📚 Additional Resources

- [GitHub MCP Test Results](./GITHUB_MCP_TEST_RESULTS.md)
- [GitHub MCP Rules](../rules/github-mcp-rules.md)
- [GitHub MCP Quick Reference](./github-mcp-quick-reference.md)
- [MCP Server Setup Guide](./mcp-server-setup-and-tool-testing.md)
- [GitHub API Documentation](https://docs.github.com/en/rest)

## 🎉 Conclusion

Once you've completed these steps, the GitHub MCP tools will be fully integrated into your chat-ai interface. Users can:

✅ **Search and discover repositories**  
✅ **Retrieve file contents and directory listings**  
✅ **Access commit history and repository metadata**  
✅ **Manage issues and pull requests**  
✅ **Search code across repositories**  
✅ **Perform file operations**  

The GitHub MCP integration provides a powerful way to interact with GitHub repositories directly through the chat interface, making repository management and development workflows more efficient and accessible.

---

**GitHub MCP Integration**: **READY FOR USE** 🚀
