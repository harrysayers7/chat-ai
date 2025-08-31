# 📋 Task Manager Setup Guide

This guide explains how to set up the Task Manager tab in your chat UI that integrates with your Notion tasks database.

## 🚀 Features

- **View Tasks**: Browse and filter tasks from your Notion database
- **Create Tasks**: Add new tasks with title, status, priority, assignee, and due date
- **Update Tasks**: Mark tasks as complete or change their status
- **Filter & Search**: Filter by status, priority, and assignee
- **Real-time Sync**: Tasks are synchronized with your Notion database

## 🔧 Setup Instructions

### 1. Create a Notion Integration

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Give it a name (e.g., "Chat AI Task Manager")
4. Select the workspace where your task database is located
5. Copy the "Internal Integration Token"

### 2. Share Your Database

1. Open your Notion task database
2. Click the "Share" button in the top right
3. Click "Invite" and search for your integration name
4. Select the integration and click "Invite"
5. Make sure it has "Can edit" permissions

### 3. Configure in Chat UI

1. Navigate to the **Task Manager** tab in your chat UI
2. Click on the **Settings** tab
3. Paste your Notion API key
4. Click "Test Connection"
5. Select your task database from the dropdown

### 4. Environment Variables

Add your Notion API key to your environment:

```bash
# .env.local
NOTION_API_KEY=your_integration_token_here
```

## 🗄️ Database Structure

Your Notion database should have these properties:

| Property Name | Type | Required | Description |
|---------------|------|----------|-------------|
| Title | Title | ✅ | Task name/description |
| Status | Select | ✅ | Not Started, In Progress, Done, Blocked |
| Priority | Select | ✅ | Low, Medium, High, Urgent |
| Assignee | People | ❌ | Who is responsible for the task |
| Due Date | Date | ❌ | When the task is due |
| Description | Rich Text | ❌ | Additional task details |

## 🔄 API Endpoints

The task manager uses these API endpoints:

- `GET /api/tasks` - Fetch tasks with filters
- `POST /api/tasks` - Create new task
- `PATCH /api/tasks/[id]` - Update existing task
- `GET /api/tasks/databases` - List available databases

## 🛠️ MCP Server Integration

For advanced users, you can also use the Notion MCP server:

```bash
# Install dependencies
npm install @modelcontextprotocol/sdk

# Run the MCP server
npx tsx custom-mcp-server/notion-tasks.ts
```

This provides tools for:
- `get_tasks` - Retrieve tasks from a database
- `create_task` - Create new tasks
- `update_task` - Modify existing tasks
- `list_databases` - Browse available databases

## 🎯 Usage Examples

### View All Tasks
Navigate to the Task Manager tab and your tasks will automatically load.

### Create a New Task
1. Click "New Task" button
2. Fill in the task details
3. Click "Create Task"

### Filter Tasks
Use the filter panel to:
- Show only high-priority tasks
- Filter by assignee
- View tasks by status

### Mark Task Complete
Click the checkbox next to any task to mark it as "Done".

## 🔒 Security

- API keys are stored locally in your browser
- All API calls require authentication
- Tasks are scoped to your user account
- Database access is limited to shared databases

## 🐛 Troubleshooting

### "Notion API key not configured"
- Check your environment variables
- Ensure the API key is set in the Settings tab

### "Failed to connect to Notion"
- Verify your API key is correct
- Check that your integration has access to the database
- Ensure the database is shared with your integration

### "No tasks found"
- Verify the database ID is correct
- Check that the database has the required properties
- Ensure tasks exist in the database

### Tasks not updating
- Refresh the page to reload tasks
- Check the browser console for errors
- Verify API endpoint responses

## 📱 Mobile Support

The Task Manager is fully responsive and works on:
- Desktop browsers
- Mobile devices
- Tablet screens

## 🔮 Future Enhancements

Planned features:
- Task templates
- Bulk operations
- Due date notifications
- Task dependencies
- Time tracking
- Export functionality

## 📞 Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Notion integration setup
3. Test the API endpoints directly
4. Check the application logs

---

**Note**: This integration requires a Notion account and a database with the specified structure. The free Notion plan supports up to 5 integrations.


