# Task Master Setup for Chat-AI

This directory contains the Task Master configuration and project management files for the chat-ai project.

## Structure

```
.taskmaster/
├── config.json          # Task Master configuration
├── docs/
│   └── prd.txt         # Product Requirements Document
├── tasks/              # Generated task files
├── templates/
│   └── example_prd.txt # PRD template
└── README.md           # This file
```

## Usage

### Initialize Task Master
In your Cursor chat, say:
```
Initialize taskmaster-ai in my project
```

### Parse PRD and Generate Tasks
```
Can you parse my PRD at .taskmaster/docs/prd.txt?
```

### View Tasks
```
What's the next task I should work on?
Can you show me tasks 1, 3, and 5?
```

### Research
```
Research the latest best practices for implementing JWT authentication with Node.js
```

## Configuration

The `config.json` file contains:
- Project metadata
- Model configuration (main, research, fallback)
- Enabled features
- Directory structure

## Models Available

- **Main Model**: Claude 3.5 Sonnet (for primary task generation)
- **Research Model**: Claude 3.5 Sonnet (for research tasks)
- **Fallback Model**: GPT-4o (backup option)

## Features Enabled

- ✅ PRD parsing and task generation
- ✅ Research capabilities
- ✅ Task management
- ✅ Workflow integration

## Next Steps

1. Parse the PRD to generate initial tasks
2. Review and prioritize tasks
3. Start working on high-priority items
4. Use research capabilities for technical decisions
5. Track progress and update tasks as needed

