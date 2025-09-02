# GitHub MCP Integration Rules

**Version**: 1.0  
**Last Updated**: 2025-01-27 14:30:00 UTC  
**Status**: Active

## 🎯 Purpose

These rules govern the usage, configuration, and management of GitHub MCP (Model Context Protocol) integration within the chat-ai application. They ensure secure, efficient, and consistent GitHub operations.

## 🔐 Security Rules

### Authentication & Access Control
- **GitHub Token Required**: All GitHub MCP operations require a valid `GITHUB_TOKEN` environment variable
- **Token Permissions**: GitHub token must have appropriate scopes:
  - `repo` (for private repositories)
  - `public_repo` (for public repositories)
  - `read:org` (for organization access)
  - `read:user` (for user information)
- **Token Security**: Never expose GitHub tokens in logs, error messages, or client-side code
- **Token Rotation**: Rotate GitHub tokens regularly (recommended: every 90 days)

### Repository Access
- **Read-Only by Default**: All GitHub MCP operations default to read-only unless explicitly configured
- **Write Operations**: Require explicit user confirmation for destructive operations
- **Private Repositories**: Only accessible with proper token permissions
- **Rate Limiting**: Respect GitHub API rate limits (5,000 requests/hour for authenticated users)

## 🛠️ Configuration Rules

### MCP Server Configuration
- **Server Package**: Use `@modelcontextprotocol/server-github@latest` for latest features
- **Environment Variables**: Store sensitive data in environment variables, not in configuration files
- **Configuration Validation**: Validate MCP configuration on startup
- **Fallback Handling**: Provide graceful fallbacks when GitHub API is unavailable

### File-based Configuration
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

## 📋 Usage Rules

### Tool Selection & Mentions
- **Manual Tool Selection**: Default to manual tool selection for GitHub operations
- **Auto-Selection**: Only enable auto-selection for idempotent operations (read-only)
- **Tool Mentions**: Use `@mcp_github_*` format for one-off GitHub operations
- **Tool Presets**: Create presets for common GitHub workflows (e.g., "Repository Management", "Issue Tracking")

### Operation Limits
- **Chain Limits**: Maximum 5 consecutive GitHub MCP calls per conversation
- **Stop on Repeated Thoughts**: Stop execution if the same operation is attempted multiple times
- **Timeout Handling**: Set 30-second timeout for GitHub API operations
- **Error Recovery**: Implement exponential backoff for rate limit errors

### Side Effects & Confirmations
- **Destructive Operations**: Always ask for confirmation before:
  - Creating new repositories
  - Deleting files or repositories
  - Merging pull requests
  - Creating issues or pull requests
- **Read Operations**: No confirmation required for read-only operations
- **Batch Operations**: Confirm before performing operations on multiple repositories

## 🔄 Workflow Rules

### Repository Management
- **Repository Discovery**: Use `mcp_github_search_repositories` for finding repositories
- **File Operations**: Use `mcp_github_get_file_contents` before modifying files
- **Commit History**: Use `mcp_github_list_commits` to understand repository state
- **Branch Management**: Always check existing branches before creating new ones

### Issue & Pull Request Management
- **Issue Creation**: Require title, body, and appropriate labels
- **Pull Request Creation**: Require title, description, and base/head branches
- **Comment Management**: Use `mcp_github_add_issue_comment` for adding context
- **Status Updates**: Use `mcp_github_update_issue` for status changes

### Search Operations
- **Repository Search**: Use specific queries to avoid rate limiting
- **Code Search**: Limit search scope to specific repositories when possible
- **User Search**: Use `mcp_github_search_users` for finding collaborators
- **Issue Search**: Use `mcp_github_search_issues` for finding related issues

## 📊 Monitoring & Logging Rules

### Performance Monitoring
- **Response Time Tracking**: Monitor GitHub API response times
- **Rate Limit Monitoring**: Track API usage and rate limit status
- **Error Rate Monitoring**: Monitor failed requests and error types
- **Usage Analytics**: Track most frequently used GitHub MCP tools

### Logging Requirements
- **Operation Logging**: Log all GitHub MCP operations with timestamps
- **Error Logging**: Log detailed error information for debugging
- **Security Logging**: Log authentication failures and access attempts
- **Audit Trail**: Maintain audit trail for all GitHub operations

### Alerting Rules
- **Rate Limit Alerts**: Alert when approaching GitHub API rate limits
- **Authentication Failures**: Alert on repeated authentication failures
- **High Error Rates**: Alert when error rate exceeds 5%
- **Unusual Activity**: Alert on unusual GitHub operation patterns

## 🚨 Error Handling Rules

### API Error Handling
- **Rate Limit Errors**: Implement exponential backoff with jitter
- **Authentication Errors**: Clear cached tokens and request re-authentication
- **Network Errors**: Retry with exponential backoff (max 3 retries)
- **Validation Errors**: Provide clear error messages to users

### User Error Handling
- **Invalid Repository**: Provide suggestions for correct repository names
- **Permission Errors**: Explain required permissions and how to obtain them
- **File Not Found**: Suggest alternative file paths or creation options
- **Branch Errors**: Provide guidance on branch naming and creation

### Fallback Strategies
- **API Unavailable**: Provide cached results when available
- **Partial Failures**: Continue with successful operations, report failures
- **Timeout Handling**: Provide partial results and suggest retry
- **Configuration Errors**: Fall back to default configurations

## 🔧 Maintenance Rules

### Regular Maintenance
- **Package Updates**: Update `@modelcontextprotocol/server-github` monthly
- **Token Rotation**: Rotate GitHub tokens every 90 days
- **Configuration Review**: Review MCP configuration quarterly
- **Performance Review**: Analyze GitHub API usage monthly

### Testing Requirements
- **Integration Tests**: Run GitHub MCP tests before deployments
- **Authentication Tests**: Test token validity and permissions
- **Rate Limit Tests**: Test rate limit handling and recovery
- **Error Handling Tests**: Test error scenarios and fallbacks

### Documentation Updates
- **Rule Updates**: Update rules when GitHub API changes
- **Tool Documentation**: Keep tool descriptions current
- **Example Updates**: Update usage examples regularly
- **Troubleshooting Guides**: Maintain troubleshooting documentation

## 📚 Best Practices

### Development Practices
- **Idempotent Operations**: Design operations to be idempotent when possible
- **Batch Operations**: Group related operations to reduce API calls
- **Caching**: Cache frequently accessed data to reduce API usage
- **Async Operations**: Use asynchronous operations for better performance

### User Experience
- **Clear Feedback**: Provide clear feedback for all operations
- **Progress Indicators**: Show progress for long-running operations
- **Error Messages**: Provide actionable error messages
- **Help Documentation**: Maintain comprehensive help documentation

### Security Practices
- **Least Privilege**: Use tokens with minimal required permissions
- **Token Scoping**: Scope tokens to specific repositories when possible
- **Audit Logging**: Log all GitHub operations for security auditing
- **Access Reviews**: Regularly review GitHub access permissions

## 🚀 Deployment Rules

### Pre-deployment Checklist
- [ ] GitHub token configured and tested
- [ ] MCP server configuration validated
- [ ] Rate limiting configured
- [ ] Error handling tested
- [ ] Monitoring configured
- [ ] Documentation updated

### Post-deployment Validation
- [ ] GitHub MCP tools accessible
- [ ] Authentication working
- [ ] Rate limiting functional
- [ ] Error handling operational
- [ ] Monitoring active
- [ ] User feedback collected

## 📞 Support & Escalation

### Support Levels
- **Level 1**: Basic usage questions and configuration issues
- **Level 2**: GitHub API integration problems and rate limiting
- **Level 3**: Security issues and token management
- **Level 4**: GitHub API changes and advanced troubleshooting

### Escalation Criteria
- **Security Incidents**: Immediate escalation for security issues
- **API Outages**: Escalate if GitHub API is unavailable
- **Rate Limit Issues**: Escalate if rate limiting is not working
- **Data Loss**: Immediate escalation for any data loss incidents

## 🔄 Rule Updates

### Update Process
1. **Review Current Rules**: Assess effectiveness of current rules
2. **Identify Changes**: Identify needed updates based on usage patterns
3. **Stakeholder Review**: Review changes with relevant stakeholders
4. **Implementation**: Implement rule changes
5. **Communication**: Communicate changes to all users
6. **Monitoring**: Monitor impact of rule changes

### Version Control
- **Version Numbering**: Use semantic versioning (major.minor.patch)
- **Change Log**: Maintain detailed change log
- **Backward Compatibility**: Maintain backward compatibility when possible
- **Migration Guides**: Provide migration guides for breaking changes

---

**These rules are living documents and should be updated based on usage patterns, GitHub API changes, and user feedback.**

**Last Review**: 2025-01-27  
**Next Review**: 2025-04-27  
**Rule Owner**: Development Team  
**Approval**: Technical Lead
