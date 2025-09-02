#!/bin/bash

# ===========================================
# DEPLOYMENT SETUP SCRIPT
# ===========================================
# This script helps set up the deployment environment
# Usage: ./scripts/setup-deployment.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_dependencies() {
    log_info "Checking dependencies..."
    
    local missing_deps=()
    
    # Check for required commands
    command -v git >/dev/null 2>&1 || missing_deps+=("git")
    command -v node >/dev/null 2>&1 || missing_deps+=("node")
    command -v pnpm >/dev/null 2>&1 || missing_deps+=("pnpm")
    command -v tsx >/dev/null 2>&1 || missing_deps+=("tsx")
    command -v ssh >/dev/null 2>&1 || missing_deps+=("ssh")
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing dependencies: ${missing_deps[*]}"
        log_info "Please install the missing dependencies and run this script again."
        exit 1
    fi
    
    log_success "All dependencies are installed"
}

setup_environment_files() {
    log_info "Setting up environment files..."
    
    # Create staging environment file
    if [ ! -f ".env.staging" ]; then
        if [ -f "scripts/env-templates/staging.env.example" ]; then
            cp scripts/env-templates/staging.env.example .env.staging
            log_success "Created .env.staging from template"
        else
            log_error "Staging environment template not found"
            exit 1
        fi
    else
        log_info ".env.staging already exists"
    fi
    
    # Create production environment file
    if [ ! -f ".env.production" ]; then
        if [ -f "scripts/env-templates/production.env.example" ]; then
            cp scripts/env-templates/production.env.example .env.production
            log_success "Created .env.production from template"
        else
            log_error "Production environment template not found"
            exit 1
        fi
    else
        log_info ".env.production already exists"
    fi
}

generate_ssh_key() {
    log_info "Setting up SSH key for deployment..."
    
    local ssh_key_path="$HOME/.ssh/github_actions_deploy"
    
    if [ ! -f "$ssh_key_path" ]; then
        log_info "Generating SSH key pair..."
        ssh-keygen -t ed25519 -C "github-actions-deploy" -f "$ssh_key_path" -N ""
        log_success "SSH key pair generated"
    else
        log_info "SSH key already exists"
    fi
    
    # Display public key
    log_info "SSH Public Key (add this to your server's authorized_keys):"
    echo "----------------------------------------"
    cat "${ssh_key_path}.pub"
    echo "----------------------------------------"
    
    # Display private key
    log_info "SSH Private Key (add this to GitHub Secrets):"
    echo "----------------------------------------"
    cat "$ssh_key_path"
    echo "----------------------------------------"
}

validate_environment() {
    log_info "Validating environment files..."
    
    # Validate staging environment
    if [ -f ".env.staging" ]; then
        log_info "Validating staging environment..."
        if tsx scripts/validate-env.ts staging; then
            log_success "Staging environment validation passed"
        else
            log_warning "Staging environment validation failed - please update .env.staging"
        fi
    fi
    
    # Validate production environment
    if [ -f ".env.production" ]; then
        log_info "Validating production environment..."
        if tsx scripts/validate-env.ts production; then
            log_success "Production environment validation passed"
        else
            log_warning "Production environment validation failed - please update .env.production"
        fi
    fi
}

show_next_steps() {
    log_info "Next Steps:"
    echo ""
    echo "1. 🔐 Set up GitHub Secrets:"
    echo "   - Go to your GitHub repository → Settings → Secrets and variables → Actions"
    echo "   - Add the following secrets:"
    echo "     • STAGING_SSH_PRIVATE_KEY (copy from above)"
    echo "     • PRODUCTION_SSH_PRIVATE_KEY (copy from above)"
    echo "     • STAGING_SERVER_HOST (134.199.159.190)"
    echo "     • STAGING_SERVER_USER (chat-ai)"
    echo "     • STAGING_DOMAIN (testchat.sayers.app)"
    echo "     • PRODUCTION_SERVER_HOST (134.199.159.190)"
    echo "     • PRODUCTION_SERVER_USER (chat-ai)"
    echo "     • PRODUCTION_DOMAIN (chat.sayers.app)"
    echo ""
    echo "2. 🖥️  Set up server access:"
    echo "   - Add the SSH public key to your server's authorized_keys:"
    echo "     ssh-copy-id -i ~/.ssh/github_actions_deploy.pub chat-ai@134.199.159.190"
    echo ""
    echo "3. 🌍 Configure environment files:"
    echo "   - Edit .env.staging with your staging configuration"
    echo "   - Edit .env.production with your production configuration"
    echo "   - Run validation: tsx scripts/validate-env.ts staging"
    echo "   - Run validation: tsx scripts/validate-env.ts production"
    echo ""
    echo "4. 🚀 Test deployment:"
    echo "   - Deploy to staging: ./scripts/deploy-staging.sh"
    echo "   - Deploy to production: ./scripts/deploy-production.sh"
    echo ""
    echo "5. 📚 Read the full documentation:"
    echo "   - docs/DEPLOYMENT_SETUP.md"
    echo ""
    log_success "Setup completed! Follow the steps above to complete the configuration."
}

main() {
    echo "🚀 Deployment Setup Script"
    echo "=========================="
    echo ""
    
    check_dependencies
    setup_environment_files
    generate_ssh_key
    validate_environment
    show_next_steps
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --env-only     Only set up environment files"
        echo "  --ssh-only     Only generate SSH keys"
        echo ""
        echo "This script helps set up the deployment environment by:"
        echo "  • Checking dependencies"
        echo "  • Creating environment file templates"
        echo "  • Generating SSH keys for server access"
        echo "  • Validating environment configuration"
        echo "  • Providing next steps for GitHub Secrets setup"
        exit 0
        ;;
    --env-only)
        check_dependencies
        setup_environment_files
        validate_environment
        log_success "Environment files setup completed!"
        exit 0
        ;;
    --ssh-only)
        generate_ssh_key
        log_success "SSH key generation completed!"
        exit 0
        ;;
    "")
        main
        ;;
    *)
        log_error "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac
