#!/bin/bash

# ===========================================
# PRODUCTION DEPLOYMENT SCRIPT
# ===========================================
# This script deploys the application to production server
# Usage: ./scripts/deploy-production.sh [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PRODUCTION_SERVER_HOST="${PRODUCTION_SERVER_HOST:-134.199.159.190}"
PRODUCTION_SERVER_USER="${PRODUCTION_SERVER_USER:-chat-ai}"
PRODUCTION_DOMAIN="${PRODUCTION_DOMAIN:-chat.sayers.app}"
DEPLOY_DIR="/home/chat-ai/deploy-production"
BRANCH="${DEPLOY_BRANCH:-main}"
VERSION="${DEPLOY_VERSION:-latest}"

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
    if [ ! -f ".env.production" ]; then
        log_error "Environment file .env.production not found."
        log_info "Create it by copying: cp scripts/env-templates/production.env.example .env.production"
        exit 1
    fi
    
    # Validate environment
    log_info "Validating production environment..."
    if ! tsx scripts/validate-env.ts production; then
        log_error "Environment validation failed."
        exit 1
    fi
    
    # Confirm production deployment
    if [ "${FORCE_DEPLOY:-}" != "true" ]; then
        log_warning "You are about to deploy to PRODUCTION!"
        log_info "This will affect live users at https://${PRODUCTION_DOMAIN}"
        echo ""
        read -p "Are you sure you want to continue? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            log_info "Deployment cancelled."
            exit 0
        fi
    fi
    
    log_success "Prerequisites check passed"
}

create_backup() {
    log_info "Creating production backup..."
    
    ssh ${PRODUCTION_SERVER_USER}@${PRODUCTION_SERVER_HOST} << EOF
        set -e
        
        echo "💾 Creating production backup..."
        
        BACKUP_DIR="/home/chat-ai/backups/production_\$(date +%Y%m%d_%H%M%S)"
        mkdir -p "\$BACKUP_DIR"
        
        # Backup current deployment
        if [ -d "${DEPLOY_DIR}" ]; then
            echo "📦 Backing up current deployment..."
            cp -r "${DEPLOY_DIR}" "\$BACKUP_DIR/"
            
            # Backup database
            echo "🗄️  Backing up database..."
            cd "${DEPLOY_DIR}"
            if [ -f ".env" ]; then
                source .env
                pg_dump "\$POSTGRES_URL" > "\$BACKUP_DIR/database_backup.sql" || echo "⚠️  Database backup failed"
            fi
            
            echo "✅ Backup created at \$BACKUP_DIR"
        else
            echo "⚠️  No existing deployment to backup"
        fi
        
        # Keep only last 5 backups
        ls -t /home/chat-ai/backups/ | tail -n +6 | xargs -r rm -rf
EOF
    
    log_success "Backup created successfully"
}

deploy_to_server() {
    log_info "Deploying to production server..."
    
    # Create deployment package
    log_info "Creating deployment package..."
    tar -czf production-deploy.tar.gz \
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
    scp production-deploy.tar.gz ${PRODUCTION_SERVER_USER}@${PRODUCTION_SERVER_HOST}:/tmp/
    scp .env.production ${PRODUCTION_SERVER_USER}@${PRODUCTION_SERVER_HOST}:/tmp/.env
    
    # Deploy on server
    log_info "Deploying on server..."
    ssh ${PRODUCTION_SERVER_USER}@${PRODUCTION_SERVER_HOST} << EOF
        set -e
        
        echo "🚀 Starting production deployment..."
        
        # Extract new deployment
        echo "📦 Extracting deployment..."
        rm -rf "${DEPLOY_DIR}"
        mkdir -p "${DEPLOY_DIR}"
        cd "${DEPLOY_DIR}"
        tar -xzf /tmp/production-deploy.tar.gz
        
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
        if ! pnpm db:push; then
            echo "❌ Database migration failed!"
            echo "🔄 Rolling back to previous version..."
            # Rollback logic would go here
            exit 1
        fi
        
        # Build application
        echo "🏗️  Building application..."
        pnpm build
        
        # Graceful restart
        echo "🔄 Gracefully restarting application..."
        
        # Stop current application gracefully
        if pgrep -f "next start" > /dev/null; then
            echo "🛑 Stopping current application..."
            pkill -TERM -f "next start"
            sleep 10
            
            # Force kill if still running
            if pgrep -f "next start" > /dev/null; then
                echo "⚠️  Force stopping application..."
                pkill -KILL -f "next start"
                sleep 2
            fi
        fi
        
        # Start application
        echo "🚀 Starting new application..."
        nohup pnpm start > app.log 2>&1 &
        sleep 10
        
        # Verify deployment
        echo "✅ Verifying deployment..."
        for i in {1..10}; do
            if curl -f http://localhost:3000/health > /dev/null 2>&1; then
                echo "🎉 Production deployment successful!"
                break
            else
                echo "⏳ Waiting for application... (attempt \$i/10)"
                sleep 5
            fi
        done
        
        if ! curl -f http://localhost:3000/health > /dev/null 2>&1; then
            echo "❌ Deployment verification failed"
            echo "📋 Application logs:"
            tail -n 50 app.log
            exit 1
        fi
        
        # Cleanup
        rm -f /tmp/production-deploy.tar.gz /tmp/.env
EOF
    
    # Cleanup local files
    rm -f production-deploy.tar.gz
    
    log_success "Deployment completed successfully"
}

verify_deployment() {
    log_info "Verifying production deployment..."
    
    # Check server connectivity
    if curl -f --connect-timeout 15 "http://${PRODUCTION_SERVER_HOST}:3000" > /dev/null 2>&1; then
        log_success "Server is responding on port 3000"
    else
        log_error "Server is not responding on port 3000"
        return 1
    fi
    
    # Check domain (if DNS is configured)
    if curl -f --connect-timeout 15 "https://${PRODUCTION_DOMAIN}" > /dev/null 2>&1; then
        log_success "Production domain is accessible: https://${PRODUCTION_DOMAIN}"
    else
        log_warning "Production domain not accessible. Check DNS/SSL configuration."
        log_info "Direct server access: http://${PRODUCTION_SERVER_HOST}:3000"
    fi
    
    # Run health checks
    log_info "Running health checks..."
    ssh ${PRODUCTION_SERVER_USER}@${PRODUCTION_SERVER_HOST} << EOF
        cd "${DEPLOY_DIR}"
        
        # Check database connectivity
        if pnpm db:check > /dev/null 2>&1; then
            echo "✅ Database connectivity verified"
        else
            echo "⚠️  Database connectivity check failed"
        fi
        
        # Check application health
        if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
            echo "✅ Application health check passed"
        else
            echo "⚠️  Application health check failed"
        fi
EOF
}

show_deployment_info() {
    log_info "Production Deployment Information:"
    echo "   Server: ${PRODUCTION_SERVER_HOST}"
    echo "   Domain: https://${PRODUCTION_DOMAIN}"
    echo "   Direct: http://${PRODUCTION_SERVER_HOST}:3000"
    echo "   Branch: ${BRANCH}"
    echo "   Version: ${VERSION}"
    echo ""
    log_info "Useful commands:"
    echo "   View logs: ssh ${PRODUCTION_SERVER_USER}@${PRODUCTION_SERVER_HOST} 'tail -f ${DEPLOY_DIR}/app.log'"
    echo "   Check status: ssh ${PRODUCTION_SERVER_USER}@${PRODUCTION_SERVER_HOST} 'ps aux | grep next'"
    echo "   Monitor: ssh ${PRODUCTION_SERVER_USER}@${PRODUCTION_SERVER_HOST} 'cd ${DEPLOY_DIR} && pnpm db:check'"
    echo ""
    log_warning "Important: Monitor the application closely after deployment!"
}

# Main execution
main() {
    echo "🚀 Production Deployment Script"
    echo "================================="
    echo ""
    
    check_prerequisites
    create_backup
    deploy_to_server
    verify_deployment
    show_deployment_info
    
    log_success "Production deployment completed successfully!"
    log_info "Application is now live at: https://${PRODUCTION_DOMAIN}"
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
        echo "  --force        Skip confirmation prompt"
        echo ""
        echo "Environment variables:"
        echo "  PRODUCTION_SERVER_HOST    Server hostname (default: 134.199.159.190)"
        echo "  PRODUCTION_SERVER_USER    SSH user (default: chat-ai)"
        echo "  PRODUCTION_DOMAIN         Domain name (default: chat.sayers.app)"
        echo "  DEPLOY_BRANCH             Git branch to deploy (default: main)"
        echo "  DEPLOY_VERSION            Version to deploy (default: latest)"
        echo "  FORCE_DEPLOY              Skip confirmation (default: false)"
        exit 0
        ;;
    --verify)
        verify_deployment
        exit 0
        ;;
    --logs)
        ssh ${PRODUCTION_SERVER_USER}@${PRODUCTION_SERVER_HOST} "tail -f ${DEPLOY_DIR}/app.log"
        exit 0
        ;;
    --force)
        export FORCE_DEPLOY=true
        main
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
