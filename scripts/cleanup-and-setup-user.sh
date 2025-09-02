#!/bin/bash

# ===========================================
# SERVER USER SETUP AND CLEANUP SCRIPT
# ===========================================
# This script cleans up existing deployments and sets up a dedicated chat-ai user
# Usage: ./scripts/cleanup-and-setup-user.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_HOST="${SERVER_HOST:-134.199.159.190}"
SERVER_USER="${SERVER_USER:-root}"
CHAT_AI_USER="chat-ai"
DEPLOY_DIR="/home/${CHAT_AI_USER}/deploy"

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

check_server_connection() {
    log_info "Checking server connection..."
    
    if ! ssh -o ConnectTimeout=10 ${SERVER_USER}@${SERVER_HOST} "echo 'Connected successfully'" > /dev/null 2>&1; then
        log_error "Cannot connect to server ${SERVER_HOST} as ${SERVER_USER}"
        log_info "Please ensure:"
        echo "  1. SSH key is set up correctly"
        echo "  2. Server is accessible"
        echo "  3. User has sudo privileges"
        exit 1
    fi
    
    log_success "Server connection verified"
}

cleanup_existing_deployments() {
    log_info "Cleaning up existing deployments..."
    
    ssh ${SERVER_USER}@${SERVER_HOST} << EOF
        set -e
        
        echo "🧹 Cleaning up existing deployments..."
        
        # Stop any running applications
        echo "🛑 Stopping running applications..."
        pkill -f "next start" || echo "No running applications found"
        sleep 2
        
        # Remove existing deployment directories
        echo "🗑️  Removing existing deployment directories..."
        rm -rf /root/deploy-staging /root/deploy-production || echo "No existing deployments found"
        rm -rf /home/${CHAT_AI_USER}/deploy-staging /home/${CHAT_AI_USER}/deploy-production || echo "No existing user deployments found"
        
        # Clean up any existing chat-ai folder
        if [ -d "/root/chat-ai" ]; then
            echo "🗑️  Removing existing /root/chat-ai folder..."
            rm -rf /root/chat-ai
        fi
        
        # Clean up temporary files
        echo "🧹 Cleaning up temporary files..."
        rm -f /tmp/*-deploy.tar.gz /tmp/.env
        
        echo "✅ Cleanup completed"
EOF
    
    log_success "Existing deployments cleaned up"
}

create_dedicated_user() {
    log_info "Creating dedicated chat-ai user..."
    
    ssh ${SERVER_USER}@${SERVER_HOST} << EOF
        set -e
        
        echo "👤 Setting up dedicated user: ${CHAT_AI_USER}"
        
        # Create user if it doesn't exist
        if ! id "${CHAT_AI_USER}" &>/dev/null; then
            echo "➕ Creating user ${CHAT_AI_USER}..."
            useradd -m -s /bin/bash ${CHAT_AI_USER}
            echo "✅ User ${CHAT_AI_USER} created"
        else
            echo "ℹ️  User ${CHAT_AI_USER} already exists"
        fi
        
        # Create deployment directories
        echo "📁 Creating deployment directories..."
        mkdir -p /home/${CHAT_AI_USER}/deploy-staging
        mkdir -p /home/${CHAT_AI_USER}/deploy-production
        mkdir -p /home/${CHAT_AI_USER}/backups
        mkdir -p /home/${CHAT_AI_USER}/logs
        
        # Set proper ownership
        chown -R ${CHAT_AI_USER}:${CHAT_AI_USER} /home/${CHAT_AI_USER}
        
        # Add user to necessary groups
        usermod -aG sudo ${CHAT_AI_USER} || echo "⚠️  Could not add to sudo group"
        
        # Create .ssh directory for the user
        mkdir -p /home/${CHAT_AI_USER}/.ssh
        chown ${CHAT_AI_USER}:${CHAT_AI_USER} /home/${CHAT_AI_USER}/.ssh
        chmod 700 /home/${CHAT_AI_USER}/.ssh
        
        echo "✅ User setup completed"
EOF
    
    log_success "Dedicated user created successfully"
}

setup_user_environment() {
    log_info "Setting up user environment..."
    
    ssh ${SERVER_USER}@${SERVER_HOST} << EOF
        set -e
        
        echo "⚙️  Setting up user environment..."
        
        # Install Node.js and pnpm for the user
        echo "📦 Installing Node.js and pnpm..."
        
        # Switch to chat-ai user and install Node.js
        sudo -u ${CHAT_AI_USER} bash << 'USER_SCRIPT'
            # Install Node.js using nvm
            if [ ! -d "/home/${CHAT_AI_USER}/.nvm" ]; then
                echo "📥 Installing nvm..."
                curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
                source /home/${CHAT_AI_USER}/.nvm/nvm.sh
                nvm install 20
                nvm use 20
                nvm alias default 20
            fi
            
            # Install pnpm
            if ! command -v pnpm &> /dev/null; then
                echo "📥 Installing pnpm..."
                source /home/${CHAT_AI_USER}/.nvm/nvm.sh
                npm install -g pnpm
            fi
            
            # Create .bashrc additions
            echo "📝 Setting up shell environment..."
            cat >> /home/${CHAT_AI_USER}/.bashrc << 'BASHRC_EOF'
            
# Node.js and pnpm setup
export NVM_DIR="\$HOME/.nvm"
[ -s "\$NVM_DIR/nvm.sh" ] && \. "\$NVM_DIR/nvm.sh"
[ -s "\$NVM_DIR/bash_completion" ] && \. "\$NVM_DIR/bash_completion"

# Deployment aliases
alias deploy-staging="cd /home/${CHAT_AI_USER}/deploy-staging"
alias deploy-production="cd /home/${CHAT_AI_USER}/deploy-production"
alias view-logs="tail -f /home/${CHAT_AI_USER}/logs/app.log"
alias check-status="ps aux | grep next"
BASHRC_EOF
            
            echo "✅ User environment setup completed"
USER_SCRIPT
EOF
    
    log_success "User environment configured"
}

setup_ssh_access() {
    log_info "Setting up SSH access for chat-ai user..."
    
    # Generate SSH key for chat-ai user
    local ssh_key_path="$HOME/.ssh/chat_ai_deploy"
    
    if [ ! -f "$ssh_key_path" ]; then
        log_info "Generating SSH key for chat-ai user..."
        ssh-keygen -t ed25519 -C "chat-ai-deploy" -f "$ssh_key_path" -N ""
        log_success "SSH key generated"
    else
        log_info "SSH key already exists"
    fi
    
    # Copy public key to server
    log_info "Setting up SSH access on server..."
    ssh-copy-id -i "${ssh_key_path}.pub" ${CHAT_AI_USER}@${SERVER_HOST} || {
        log_warning "Could not copy SSH key automatically. Manual setup required:"
        echo "Run: ssh-copy-id -i ${ssh_key_path}.pub ${CHAT_AI_USER}@${SERVER_HOST}"
    }
    
    # Display keys for GitHub Secrets
    log_info "SSH Keys for GitHub Secrets:"
    echo "----------------------------------------"
    echo "Public Key (add to server):"
    cat "${ssh_key_path}.pub"
    echo ""
    echo "Private Key (add to GitHub Secrets):"
    cat "$ssh_key_path"
    echo "----------------------------------------"
}

show_next_steps() {
    log_info "Next Steps:"
    echo ""
    echo "1. 🔐 Update GitHub Secrets:"
    echo "   - Go to your GitHub repository → Settings → Secrets and variables → Actions"
    echo "   - Update the following secrets:"
    echo "     • STAGING_SERVER_USER = chat-ai"
    echo "     • PRODUCTION_SERVER_USER = chat-ai"
    echo "     • STAGING_SSH_PRIVATE_KEY (copy from above)"
    echo "     • PRODUCTION_SSH_PRIVATE_KEY (copy from above)"
    echo ""
    echo "2. 📝 Update deployment scripts:"
    echo "   - Update DEPLOY_DIR paths in deployment scripts"
    echo "   - Update GitHub Actions workflows"
    echo ""
    echo "3. 🚀 Test deployment:"
    echo "   - Deploy to staging: ./scripts/deploy-staging.sh"
    echo "   - Deploy to production: ./scripts/deploy-production.sh"
    echo ""
    echo "4. 🔍 Verify setup:"
    echo "   - SSH to server: ssh chat-ai@${SERVER_HOST}"
    echo "   - Check directories: ls -la /home/chat-ai/"
    echo ""
    log_success "Server user setup completed!"
}

# Main execution
main() {
    echo "🚀 Server User Setup and Cleanup Script"
    echo "========================================"
    echo ""
    
    check_server_connection
    cleanup_existing_deployments
    create_dedicated_user
    setup_user_environment
    setup_ssh_access
    show_next_steps
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --cleanup-only Only clean up existing deployments"
        echo "  --user-only    Only create the dedicated user"
        echo ""
        echo "This script:"
        echo "  • Cleans up existing deployments"
        echo "  • Creates a dedicated 'chat-ai' user"
        echo "  • Sets up proper directory structure"
        echo "  • Configures SSH access"
        echo "  • Provides next steps for GitHub Secrets"
        exit 0
        ;;
    --cleanup-only)
        check_server_connection
        cleanup_existing_deployments
        log_success "Cleanup completed!"
        exit 0
        ;;
    --user-only)
        check_server_connection
        create_dedicated_user
        setup_user_environment
        log_success "User setup completed!"
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

