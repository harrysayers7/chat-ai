#!/bin/bash

# Set environment variables for development
export BETTER_AUTH_SECRET=dev-secret-key-change-in-production
export POSTGRES_URL=postgres://your_username:your_password@localhost:5433/your_database_name
export FILE_BASED_MCP_CONFIG=true
export PORT=3002

# Start the development server with environment variables
VERCEL=1 BETTER_AUTH_SECRET=dev-secret-key-change-in-production POSTGRES_URL=postgres://your_username:your_password@localhost:5433/your_database_name FILE_BASED_MCP_CONFIG=true PORT=3002 pnpm dev --port 3002
