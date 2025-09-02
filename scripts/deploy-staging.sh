#!/bin/bash

# ===========================================
# STAGING DEPLOYMENT SCRIPT
# ===========================================
# This script deploys the application to staging server
# Usage: ./scripts/deploy-staging.sh [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STAGING_SERVER_HOST="${STAGING_SERVER_HOST:-134.199.159.190}"
STAGING_SERVER_USER="${STAGING_SERVER_USER:-chat-ai}"
STAGING_DOMAIN="${STAGING_DOMAIN:-testchat.sayers.app}"
DEPLOY_DIR="/home/chat-ai/deploy-staging"
BRANCH="${DEPLOY_BRANCH:-develop}"

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

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if SSH key is available
    if [ ! -f ~/.ssh/id_rsa ] && [ ! -f ~/.ssh/id_ed25519 ]; then
        log_error "No SSH key found. Please set up SSH key authentication."
        exit 1
    fi
    
    # Check if environment file exists
    if [ ! -f ".env.staging" ]; then
        log_error "Environment file .env.staging not found."
        log_info "Create it by copying: cp scripts/env-templates/staging.env.example .env.staging"
        exit 1
    fi
    
    # Validate environment
    log_info "Validating staging environment..."
    if ! tsx scripts/validate-env.ts staging; then
        log_error "Environment validation failed."
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

deploy_to_server() {
    log_info "Deploying to staging server..."
    
    # Create deployment package
    log_info "Creating deployment package..."
    tar -czf staging-deploy.tar.gz \
        --exclude=node_modules \
        --exclude=.git \
        --exclude=.next \
        --exclude=dist \
        --exclude=coverage \
        --exclude=.env* \
        --exclude=*.log \
        .
    
    # Upload to server
    log_info "Uploading to server..."
    scp staging-deploy.tar.gz ${STAGING_SERVER_USER}@${STAGING_SERVER_HOST}:/tmp/
    scp .env.staging ${STAGING_SERVER_USER}@${STAGING_SERVER_HOST}:/tmp/.env
    
    # Deploy on server
    log_info "Deploying on server..."
    ssh ${STAGING_SERVER_USER}@${STAGING_SERVER_HOST} << EOF
        set -e
        
        echo "🚀 Starting staging deployment..."
        
        # Create backup
        if [ -d "${DEPLOY_DIR}" ]; then
            echo "💾 Creating backup..."
            BACKUP_DIR="/home/chat-ai/backups/staging_\$(date +%Y%m%d_%H%M%S)"
            mkdir -p "\$BACKUP_DIR"
            cp -r "${DEPLOY_DIR}" "\$BACKUP_DIR/"
            
            # Keep only last 3 backups
            ls -t /home/chat-ai/backups/ | tail -n +4 | xargs -r rm -rf
        fi
        
        # Extract new deployment
        echo "📦 Extracting deployment..."
        rm -rf "${DEPLOY_DIR}"
        mkdir -p "${DEPLOY_DIR}"
        cd "${DEPLOY_DIR}"
        tar -xzf /tmp/staging-deploy.tar.gz
        
        # Setup environment
        echo "⚙️  Setting up environment..."
        cp /tmp/.env .env
        
        # Install dependencies
        echo "📦 Installing dependencies..."
        if ! command -v pnpm &> /dev/null; then
            npm install -g pnpm
        fi
        pnpm install --prod --frozen-lockfile
        
        # Run database migrations
        echo "🗄️  Running database migrations..."
        pnpm db:push || echo "⚠️  Database migration failed, continuing..."
        
        # Build application
        echo "🏗️  Building application..."
        pnpm build:local
        
        # Restart application
        echo "🔄 Restarting application..."
        pkill -f "next start" || true
        sleep 3
        
        # Start application
        echo "🚀 Starting application..."
        nohup pnpm start > app.log 2>&1 &
        sleep 5
        
        # Verify deployment
        echo "✅ Verifying deployment..."
        for i in {1..5}; do
            if curl -f http://localhost:3000/health > /dev/null 2>&1; then
                echo "🎉 Staging deployment successful!"
                break
            else
                echo "⏳ Waiting for application... (attempt \$i/5)"
                sleep 3
            fi
        done
        
        if ! curl -f http://localhost:3000/health > /dev/null 2>&1; then
            echo "❌ Deployment verification failed"
            echo "📋 Application logs:"
            tail -n 20 app.log
            exit 1
        fi
        
        # Cleanup
        rm -f /tmp/staging-deploy.tar.gz /tmp/.env
EOF
    
    # Cleanup local files
    rm -f staging-deploy.tar.gz
    
    log_success "Deployment completed successfully"
}

verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check server connectivity
    if curl -f --connect-timeout 10 "http://${STAGING_SERVER_HOST}:3000" > /dev/null 2>&1; then
        log_success "Server is responding on port 3000"
    else
        log_error "Server is not responding on port 3000"
        return 1
    fi
    
    # Check domain (if DNS is configured)
    if curl -f --connect-timeout 10 "http://${STAGING_DOMAIN}" > /dev/null 2>&1; then
        log_success "Staging domain is accessible: http://${STAGING_DOMAIN}"
    else
        log_warning "Staging domain not accessible. Check DNS configuration."
        log_info "Direct server access: http://${STAGING_SERVER_HOST}:3000"
    fi
}

show_deployment_info() {
    log_info "Deployment Information:"
    echo "   Server: ${STAGING_SERVER_HOST}"
    echo "   Domain: http://${STAGING_DOMAIN}"
    echo "   Direct: http://${STAGING_SERVER_HOST}:3000"
    echo "   Branch: ${BRANCH}"
    echo ""
    log_info "Useful commands:"
    echo "   View logs: ssh ${STAGING_SERVER_USER}@${STAGING_SERVER_HOST} 'tail -f ${DEPLOY_DIR}/app.log'"
    echo "   Check status: ssh ${STAGING_SERVER_USER}@${STAGING_SERVER_HOST} 'ps aux | grep next'"
    echo "   Restart app: ssh ${STAGING_SERVER_USER}@${STAGING_SERVER_HOST} 'cd ${DEPLOY_DIR} && pkill -f next && nohup pnpm start > app.log 2>&1 &'"
}

# Main execution
main() {
    echo "🚀 Staging Deployment Script"
    echo "=============================="
    echo ""
    
    check_prerequisites
    deploy_to_server
    verify_deployment
    show_deployment_info
    
    log_success "Staging deployment completed successfully!"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --verify       Only verify current deployment"
        echo "  --logs         Show deployment logs"
        echo ""
        echo "Environment variables:"
        echo "  STAGING_SERVER_HOST    Server hostname (default: 134.199.159.190)"
        echo "  STAGING_SERVER_USER    SSH user (default: chat-ai)"
        echo "  STAGING_DOMAIN         Domain name (default: testchat.sayers.app)"
        echo "  DEPLOY_BRANCH          Git branch to deploy (default: develop)"
        exit 0
        ;;
    --verify)
        verify_deployment
        exit 0
        ;;
    --logs)
        ssh ${STAGING_SERVER_USER}@${STAGING_SERVER_HOST} "tail -f ${DEPLOY_DIR}/app.log"
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
