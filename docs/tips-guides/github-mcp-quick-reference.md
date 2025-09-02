# GitHub MCP Quick Reference Guide

**Last Updated**: 2025-01-27 14:30:00 UTC

## 🚀 Quick Start

### 1. Setup GitHub Token
```bash
export GITHUB_TOKEN=your_github_token_here
```

### 2. GitHub MCP is Already Configured
The GitHub MCP server is pre-configured in `.mcp-config.json`:
```json
{
  "github-mcp": {
    "command": "npx",
    "args": ["@modelcontextprotocol/server-github@latest"],
    "env": {
      "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
    }
  }
}
```

### 3. Use in Chat
- Type `@mcp_github_*` to see available GitHub tools
- Create tool presets for common workflows
- Use tool mentions for one-off operations

## 🛠️ Available GitHub MCP Tools

### Repository Management
| Tool | Description | Example |
|------|-------------|---------|
| `mcp_github_get_file_contents` | Get file/directory contents | `@mcp_github_get_file_contents` |
| `mcp_github_create_or_update_file` | Create/update files | `@mcp_github_create_or_update_file` |
| `mcp_github_delete_file` | Delete files | `@mcp_github_delete_file` |
| `mcp_github_push_files` | Push multiple files | `@mcp_github_push_files` |
| `mcp_github_create_branch` | Create new branch | `@mcp_github_create_branch` |
| `mcp_github_list_branches` | List branches | `@mcp_github_list_branches` |

### Issues & Pull Requests
| Tool | Description | Example |
|------|-------------|---------|
| `mcp_github_list_issues` | List repository issues | `@mcp_github_list_issues` |
| `mcp_github_create_issue` | Create new issue | `@mcp_github_create_issue` |
| `mcp_github_update_issue` | Update existing issue | `@mcp_github_update_issue` |
| `mcp_github_add_issue_comment` | Add comment to issue | `@mcp_github_add_issue_comment` |
| `mcp_github_create_pull_request` | Create pull request | `@mcp_github_create_pull_request` |
| `mcp_github_list_pull_requests` | List pull requests | `@mcp_github_list_pull_requests` |
| `mcp_github_merge_pull_request` | Merge pull request | `@mcp_github_merge_pull_request` |

### Search & Discovery
| Tool | Description | Example |
|------|-------------|---------|
| `mcp_github_search_repositories` | Search repositories | `@mcp_github_search_repositories` |
| `mcp_github_search_code` | Search code | `@mcp_github_search_code` |
| `mcp_github_search_issues` | Search issues/PRs | `@mcp_github_search_issues` |
| `mcp_github_search_users` | Search users | `@mcp_github_search_users` |

### Commits & History
| Tool | Description | Example |
|------|-------------|---------|
| `mcp_github_list_commits` | List commits | `@mcp_github_list_commits` |
| `mcp_github_get_commit` | Get commit details | `@mcp_github_get_commit` |
| `mcp_github_get_pull_request_diff` | Get PR diff | `@mcp_github_get_pull_request_diff` |

## 💬 Example Commands

### Repository Operations
```
"Search for repositories containing 'chat-ai'"
"Get the contents of README.md from my repository"
"List recent commits from the main branch"
"Create a new branch called 'feature/new-feature'"
```

### Issue Management
```
"List open issues in my repository"
"Create a new issue with title 'Bug Report' and description 'Found a bug in the login system'"
"Add a comment to issue #123 explaining the fix"
"Update issue #456 status to closed"
```

### File Operations
```
"Get the contents of package.json from my repository"
"Create a new file called CHANGELOG.md with version history"
"Update the README.md file with new installation instructions"
"Delete the old config file"
```

### Search Operations
```
"Search for code containing 'useState' in my repository"
"Find all repositories with 'react' in the name"
"Search for open issues labeled 'bug'"
"Find users with 'developer' in their profile"
```

## 🔒 Security & Permissions

### Required GitHub Token Scopes
- `repo` - Full access to repositories
- `read:org` - Read organization data
- `read:user` - Read user profile data

### Token Setup
1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select required scopes
4. Copy token and set as `GITHUB_TOKEN` environment variable

## ⚠️ Important Rules

### Confirmation Required
The following operations require explicit confirmation:
- Creating new repositories
- Deleting files or repositories
- Merging pull requests
- Creating issues or pull requests
- Pushing commits to repositories

### Rate Limits
- GitHub API: 5,000 requests/hour for authenticated users
- Automatic backoff implemented for rate limit errors
- Monitor usage to avoid hitting limits

### Error Handling
- Network errors: Automatic retry with backoff
- Authentication errors: Clear tokens and request re-authentication
- Permission errors: Clear error messages with guidance
- Validation errors: Actionable error messages

## 🎯 Tool Presets

### Repository Management Preset
- `mcp_github_get_file_contents`
- `mcp_github_create_or_update_file`
- `mcp_github_delete_file`
- `mcp_github_list_commits`
- `mcp_github_create_branch`

### Issue Tracking Preset
- `mcp_github_list_issues`
- `mcp_github_create_issue`
- `mcp_github_update_issue`
- `mcp_github_add_issue_comment`
- `mcp_github_search_issues`

### Code Review Preset
- `mcp_github_list_pull_requests`
- `mcp_github_get_pull_request_diff`
- `mcp_github_search_code`
- `mcp_github_list_commits`
- `mcp_github_get_commit`

## 🚨 Troubleshooting

### Common Issues

**"Authentication failed"**
- Check if `GITHUB_TOKEN` is set correctly
- Verify token has required scopes
- Ensure token is not expired

**"Rate limit exceeded"**
- Wait for rate limit to reset
- Reduce frequency of API calls
- Use caching when possible

**"Repository not found"**
- Check repository name and owner
- Verify repository exists and is accessible
- Ensure token has access to private repositories

**"Permission denied"**
- Check token scopes
- Verify repository permissions
- Ensure user has access to the repository

### Getting Help
- Check the [GitHub MCP Test Results](./GITHUB_MCP_TEST_RESULTS.md)
- Review the [GitHub MCP Rules](../rules/github-mcp-rules.md)
- Check GitHub API documentation for specific error codes

## 📚 Additional Resources

- [GitHub MCP Test Results](./GITHUB_MCP_TEST_RESULTS.md)
- [GitHub MCP Rules](../rules/github-mcp-rules.md)
- [MCP Server Setup Guide](./mcp-server-setup-and-tool-testing.md)
- [Project with MCP Guide](./project_with_mcp.md)
- [GitHub API Documentation](https://docs.github.com/en/rest)

---

**Ready to use GitHub MCP tools in your chat-ai application!** 🎉
