# Development Makefile for chat-ai
# Usage: make <target>

.PHONY: help dev build test lint clean rules rules-update rules-watch git-status git-add git-commit git-push git-pull

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
	@echo "  git-push     - Push to remote"
	@echo "  git-pull     - Pull from remote"
	@echo ""
	@echo "Examples:"
	@echo "  make git-commit MESSAGE='feat: add new component'"
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

# Common Workflows
commit-rules: rules git-add
	@echo "📝 Staging rules changes..."
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
