# Development Makefile for chat-ai
# Usage: make <target>

.PHONY: help dev build test lint clean rules rules-update rules-watch git-status git-add git-commit git-push git-pull git-save git-quick-commit commit-rules git-diff git-log git-branch

# Default target
help:
	@echo "Available commands:"
	@echo "  dev          - Start development server"
	@echo "  build        - Build for production"
	@echo "  test         - Run tests"
	@echo "  lint         - Run linting and formatting"
	@echo "  clean        - Clean build artifacts"
	@echo ""
	@echo "Self-Learning Rules:"
	@echo "  rules        - Run full rules update (analyze + providers + merge)"
	@echo "  rules-analyze    - Analyze code patterns only"
	@echo "  rules-providers  - Generate providers view only"
	@echo "  rules-merge      - Merge rules only"
	@echo "  rules-watch      - Watch for changes and auto-update rules"
	@echo ""
	@echo "Git Operations:"
	@echo "  git-status   - Show git status"
	@echo "  git-add      - Add all changes"
	@echo "  git-commit   - Commit staged changes (set MESSAGE='your message')"
	@echo "  git-save     - Add all + commit (set MESSAGE='your message')"
	@echo "  git-quick-commit - Quick commit with timestamp (set MESSAGE='your message')"
	@echo "  git-push     - Push to remote"
	@echo "  git-pull     - Pull from remote"
	@echo "  git-diff     - Show git diff"
	@echo "  git-log      - Show recent commits"
	@echo "  git-branch   - Show branch status"
	@echo "  commit-rules - Update rules + add + commit"
	@echo ""
	@echo "Examples:"
	@echo "  make git-commit MESSAGE='feat: add new component'"
	@echo "  make git-save MESSAGE='fix: resolve temperature issue'"
	@echo "  make git-quick-commit MESSAGE='update models'"
	@echo "  make commit-rules MESSAGE='update self-learning patterns'"
	@echo "  make rules"

# Development
dev:
	pnpm dev

build:
	pnpm build

test:
	pnpm test

lint:
	pnpm lint

clean:
	pnpm clean

# Self-Learning Rules
rules: rules-analyze rules-providers rules-merge
	@echo "✅ Rules update complete!"

rules-analyze:
	@echo "🔍 Analyzing code patterns..."
	pnpm rules:analyze

rules-providers:
	@echo "🔌 Generating providers view..."
	pnpm rules:providers

rules-merge:
	@echo "🔗 Merging rules..."
	pnpm rules:merge

rules-update: rules
	@echo "🎯 Full rules update completed!"

rules-watch:
	@echo "👀 Watching for changes..."
	pnpm rules:watch

# Git Operations
git-status:
	@echo "📊 Git Status:"
	git status

git-add:
	@echo "➕ Adding all changes..."
	git add .

git-commit:
	@if [ -z "$(MESSAGE)" ]; then \
		echo "❌ Error: MESSAGE is required"; \
		echo "Usage: make git-commit MESSAGE='your commit message'"; \
		exit 1; \
	fi
	@echo "💾 Committing changes: $(MESSAGE)"
	git commit -m "$(MESSAGE)"

git-push:
	@echo "🚀 Pushing to remote..."
	git push

git-pull:
	@echo "📥 Pulling from remote..."
	git pull

# Enhanced Git Operations
git-save: git-add git-commit
	@echo "💾 All changes saved and committed!"

git-quick-commit:
	@if [ -z "$(MESSAGE)" ]; then \
		echo "❌ Error: MESSAGE is required"; \
		echo "Usage: make git-quick-commit MESSAGE='your commit message'"; \
		exit 1; \
	fi
	@echo "⚡ Quick commit: $(MESSAGE)"
	@TIMESTAMP=$$(date '+%Y-%m-%d %H:%M:%S'); \
	git add . && git commit -m "$(MESSAGE) - $(TIMESTAMP)"

# Common Workflows
commit-rules: rules git-add
	@echo "📝 Staging rules changes..."

# Git Status Helpers
git-diff:
	@echo "📋 Showing git diff..."
	git diff

git-log:
	@echo "📜 Recent commits..."
	git log --oneline -10

git-branch:
	@echo "🌿 Current branch and status..."
	git branch -v
	@echo "💡 Run 'make git-commit MESSAGE=\"your message\"' to commit"

commit-working: git-add
	@echo "📝 Staging working changes..."
	@echo "💡 Run 'make git-commit MESSAGE=\"your message\"' to commit"

# Quick Development Workflow
dev-setup: rules-update
	@echo "🚀 Development environment ready!"

# Experiment Workflow
experiment-start: git-status
	@echo "🎯 Ready to start experiments!"
	@echo "💡 Recommended workflow:"
	@echo "   1. make commit-working MESSAGE='your message'"
	@echo "   2. git checkout -b feature/your-experiment"
	@echo "   3. Experiment freely!"
	@echo "   4. If it works: make git-commit MESSAGE='success message'"
	@echo "   5. If it breaks: git reset --hard HEAD"

experiment-save:
	@echo "💾 Saving working state for experiments..."
	@echo "💡 Run: make git-commit MESSAGE='your message' to commit"

# Production Build
prod-build: clean build
	@echo "🏗️ Production build complete!"

# Quality Check
quality: lint test
	@echo "✅ Quality checks passed!"
