# 🧠 GitHub Instructions Integration Guide

> Transform your chat-ai into a powerful AI assistant by automatically pulling instructions from your GitHub repositories. This guide shows you how to integrate your `chat-gpt-brain` repository (or any other repo) as the core instructions for your AI agents.

## 🎯 What This Enables

- **Dynamic Instructions**: Your AI agents automatically get updated instructions when you update your GitHub repo
- **Version Control**: Track changes to your AI instructions through Git
- **Collaboration**: Multiple people can contribute to improving your AI instructions
- **Consistency**: All your AI agents use the same source of truth for instructions
- **Comprehensive Coverage**: Fetch instructions from multiple sources for complete knowledge

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure GitHub Access

Add your GitHub token to your `.env` file:

```bash
# GitHub Personal Access Token (for private repos)
GITHUB_TOKEN=ghp_your_token_here

# Optional: GitHub username (defaults to 'harrysayers')
GITHUB_USERNAME=harrysayers
```

**To get a GitHub token:**
1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select scopes: `repo` (for private repos) or `public_repo` (for public repos)
4. Copy the token and add it to your `.env` file

### 3. Test Configuration

```bash
pnpm github:setup
```

This will test both standard and comprehensive instruction fetching modes.

### 4. Create Your First GitHub-Connected Agent

1. **Navigate to Agents** in your chat-ai interface
2. **Click "Create Agent"**
3. **Select "GitHub Instructions Agent"** (new option)
4. **Configure your repository:**
   - **GitHub Username**: `harrysayers` (or your username)
   - **Repository Name**: `chat-gpt-brain`
   - **Branch**: `main` (or your preferred branch)
5. **Choose instruction mode:**
   - **Standard Mode**: Fetches from primary instruction files
   - **Comprehensive Mode**: Fetches from multiple sources for complete coverage
6. **Click "Fetch Instructions"**
7. **Review the fetched instructions**
8. **Configure your agent:**
   - **Name**: `chat-gpt-brain-agent`
   - **Description**: `AI agent with comprehensive instructions from my chat-gpt-brain repository`
   - **Role**: `Expert in AI assistance and knowledge management with comprehensive knowledge`
9. **Click "Create Agent with GitHub Instructions"**

## 📁 Repository Structure

Your `chat-gpt-brain` repository should contain instruction files in this priority order:

### **Standard Mode (Primary Files)**
- `instructions.md` - Main instructions and guidelines
- `MY-INSTRUCTIONS.md` - Personal instructions
- `README.md` - Project overview
- `policy/guardrails.yaml` - Policy and rules
- `prompts/system.mdx` - System prompts

### **Comprehensive Mode (Extended Coverage)**
Includes all standard files plus:
- `docs/00-README.md` - Documentation overview
- `docs/01-foundations.md` - Core foundations
- `docs/02-governance.md` - Governance rules
- `docs/03-security.md` - Security guidelines
- `docs/04-tools.md` - Tool usage
- `docs/05-style.md` - Style guide
- `docs/06-commands.md` - Command reference
- `docs/07-knowledge-architecture.md` - Knowledge structure
- `docs/50-workflows.md` - Workflows
- `docs/51-research-integration.md` - Research integration
- `docs/60-feature-flags.md` - Feature flags

## 🎨 Example Repository Structure

```
chat-gpt-brain/
├── instructions.md              # Primary instructions
├── MY-INSTRUCTIONS.md           # Personal instructions
├── README.md                    # Project overview
├── policy/
│   └── guardrails.yaml         # Policy and rules
├── prompts/
│   ├── system.mdx              # System prompts
│   └── fragments/
│       └── tone-style.mdx      # Tone and style
└── docs/
    ├── 00-README.md            # Documentation overview
    ├── 01-foundations.md       # Core foundations
    ├── 02-governance.md        # Governance rules
    ├── 03-security.md          # Security guidelines
    ├── 04-tools.md             # Tool usage
    ├── 05-style.md             # Style guide
    ├── 06-commands.md          # Command reference
    ├── 07-knowledge-architecture.md # Knowledge structure
    ├── 50-workflows.md         # Workflows
    ├── 51-research-integration.md # Research integration
    └── 60-feature-flags.md     # Feature flags
```

## 📝 Example Instruction Files

### instructions.md (Primary)
```markdown
# Chat GPT Brain - AI Assistant Instructions

You are an advanced AI assistant with the following core capabilities:

## Core Principles
- Always be helpful, accurate, and ethical
- Provide clear, actionable advice
- Ask clarifying questions when needed
- Use examples to illustrate concepts

## Knowledge Domains
- Software development and coding
- Writing and communication
- Data analysis and research
- Problem-solving and critical thinking

## Communication Style
- Professional yet friendly
- Concise but thorough
- Adapt to user's technical level
- Provide step-by-step guidance when appropriate
```

### policy/guardrails.yaml (Policy)
```yaml
guardrails:
  security:
    - never_share_secrets: true
    - validate_user_input: true
    - respect_privacy: true
  
  behavior:
    - be_helpful: true
    - be_accurate: true
    - ask_clarification: true
  
  limits:
    - max_code_length: 1000
    - require_explanation: true
```

### docs/02-governance.md (Governance)
```markdown
# Governance Rules

## Decision Making
- Follow established policies and procedures
- Escalate complex decisions to appropriate authorities
- Document all significant decisions and rationale

## Quality Assurance
- Verify information before providing advice
- Cite sources when possible
- Acknowledge limitations and uncertainties
```

## 🔄 Updating Instructions

### Method 1: Update Your Repository
1. Make changes to your instruction files in GitHub
2. Commit and push your changes
3. In your chat-ai, go to your agent settings
4. Click "Refresh Instructions" to fetch the latest version

### Method 2: Comprehensive Mode Updates
When using comprehensive mode:
- The system automatically fetches from multiple sources
- Changes to any instruction file are included
- The system prioritizes the most important sources
- Limited to 5 sources to maintain focus

### Method 3: Automatic Updates (Coming Soon)
Future versions will support automatic instruction updates when your repository changes.

## 🛠️ Advanced Configuration

### API Endpoints

**Standard Instructions:**
```bash
GET /api/github-instructions?owner=harrysayers&repo=chat-gpt-brain
```

**Comprehensive Instructions:**
```bash
GET /api/github-instructions?owner=harrysayers&repo=chat-gpt-brain&comprehensive=true
```

**With Metadata:**
```bash
GET /api/github-instructions?owner=harrysayers&repo=chat-gpt-brain&comprehensive=true&metadata=true
```

**Specific File:**
```bash
GET /api/github-instructions?owner=harrysayers&repo=chat-gpt-brain&file=docs/02-governance.md
```

### Custom Repository Support
You can use this system with any GitHub repository:

```typescript
// Example: Using a different repository
const service = new GitHubInstructionsService({
  owner: 'your-username',
  repo: 'your-repo-name',
  branch: 'main',
  instructionFiles: ['GUIDE.md', 'RULES.md', 'KNOWLEDGE.md'],
  defaultInstructions: 'Custom default instructions...'
});
```

### Multiple Instruction Sources
Combine instructions from multiple repositories:

```typescript
// Fetch from multiple repos and combine
const instructions1 = await service1.fetchComprehensiveInstructions();
const instructions2 = await service2.fetchComprehensiveInstructions();
const combinedInstructions = `${instructions1}\n\n${instructions2}`;
```

## 🚨 Troubleshooting

### Common Issues

**"Failed to fetch instructions from GitHub"**
- Check your `GITHUB_TOKEN` is valid
- Ensure the repository exists and is accessible
- Verify the branch name is correct

**"File not found"**
- Check the file path is correct
- Ensure the file exists in the specified branch
- Verify the file is not in a subdirectory

**"Unauthorized"**
- Check your GitHub token has the correct permissions
- Ensure you're logged into chat-ai
- Verify the repository is accessible with your token

**"Comprehensive mode not working"**
- Ensure your repository has the expected file structure
- Check that instruction files exist in the specified paths
- Verify file permissions and accessibility

### Debug Mode
Enable debug logging by setting in your `.env`:

```bash
DEBUG=github-instructions:*
```

### Testing Your Setup
Run the setup script to test your configuration:

```bash
pnpm github:setup
```

This will test both standard and comprehensive modes and show repository metadata.

## 🔮 Future Enhancements

- **Webhook Integration**: Automatic updates when repository changes
- **Branch Comparison**: Compare instructions between branches
- **Instruction Versioning**: Track changes and rollback if needed
- **Multi-Repository Support**: Combine instructions from multiple repos
- **Instruction Templates**: Pre-built instruction templates for common use cases
- **Smart Caching**: Intelligent caching of instruction files
- **Instruction Analytics**: Track which instruction sources are most effective

## 💡 Best Practices

1. **Keep Instructions Focused**: Each file should have a clear, specific purpose
2. **Use Markdown**: Leverage markdown formatting for better readability
3. **Version Control**: Use Git branches to test instruction changes
4. **Regular Updates**: Keep your instructions current and relevant
5. **Test Changes**: Test instruction changes in a development environment first
6. **Comprehensive Mode**: Use comprehensive mode for agents that need complete knowledge coverage
7. **Metadata**: Include repository metadata to understand your instruction sources
8. **File Organization**: Follow the recommended file structure for optimal integration

## 🎉 You're All Set!

Your chat-ai now has the power to automatically pull instructions from your GitHub repositories. This creates a dynamic, version-controlled system where your AI agents always have the latest and greatest instructions.

**Next Steps:**
1. Create your first GitHub-connected agent
2. Test both standard and comprehensive modes
3. Customize your instruction files
4. Share your setup with the community!

---

> 💡 **Pro Tip**: Use comprehensive mode to create agents with complete knowledge coverage, combining instructions from multiple sources for maximum effectiveness.

> 🧠 **Advanced Tip**: Structure your repository following the chat-gpt-brain pattern for optimal integration with the comprehensive instructions system.
