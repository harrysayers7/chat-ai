# Deployment Setup Guide

This guide covers setting up CI/CD for both staging and production deployments to your servers.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   GitHub Repo   │───▶│  GitHub Actions  │───▶│  Your Servers   │
│                 │    │                  │    │                 │
│ • Source Code   │    │ • CI/CD Pipeline │    │ • Staging       │
│ • Workflows     │    │ • Tests          │    │ • Production    │
│ • Secrets       │    │ • Deployment     │    │ • Databases     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

### 1. Server Requirements

**Staging Server:**
- Domain: `testchat.sayers.app`
- IP: `134.199.159.190`
- User: `root`
- Port: `3000`

**Production Server:**
- Domain: `chat.sayers.app`
- IP: `134.199.159.190` (same server, different deployment)
- User: `root`
- Port: `3000`

### 2. Required Software on Server

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Install Git
sudo apt-get install -y git
```

## 🔐 GitHub Secrets Setup

### Required Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

#### Staging Secrets
```
STAGING_SSH_PRIVATE_KEY     # SSH private key for server access
STAGING_SERVER_HOST         # 134.199.159.190
STAGING_SERVER_USER         # root
STAGING_DOMAIN              # testchat.sayers.app
```

#### Production Secrets
```
PRODUCTION_SSH_PRIVATE_KEY  # SSH private key for server access
PRODUCTION_SERVER_HOST      # 134.199.159.190
PRODUCTION_SERVER_USER      # root
PRODUCTION_DOMAIN           # chat.sayers.app
```

#### Shared Secrets
```
E2E_OPENROUTER_API_KEY      # For E2E testing
```

### SSH Key Setup

1. **Generate SSH Key Pair:**
```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy
```

2. **Add Public Key to Server:**
```bash
# Copy public key to server
ssh-copy-id -i ~/.ssh/github_actions_deploy.pub root@134.199.159.190

# Or manually add to authorized_keys
cat ~/.ssh/github_actions_deploy.pub | ssh root@134.199.159.190 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

3. **Add Private Key to GitHub Secrets:**
```bash
# Copy private key content
cat ~/.ssh/github_actions_deploy

# Add to GitHub Secrets as STAGING_SSH_PRIVATE_KEY and PRODUCTION_SSH_PRIVATE_KEY
```

## 🌍 Environment Configuration

### 1. Create Environment Files

```bash
# Staging environment
cp scripts/env-templates/staging.env.example .env.staging

# Production environment
cp scripts/env-templates/production.env.example .env.production
```

### 2. Fill in Environment Variables

Edit both files with your actual values:

**Required Variables:**
- `BETTER_AUTH_SECRET` - Generate at https://auth-secret-gen.vercel.app/
- `POSTGRES_URL` - Your PostgreSQL connection string
- At least one LLM provider API key (OpenAI, Anthropic, Google, etc.)

**Optional Variables:**
- OAuth provider credentials
- External service API keys
- Monitoring and logging configuration

### 3. Validate Environment Files

```bash
# Validate staging environment
tsx scripts/validate-env.ts staging

# Validate production environment
tsx scripts/validate-env.ts production
```

## 🚀 Deployment Workflows

### Automatic Deployments

**Staging:**
- Triggers on push to `develop` or `staging` branches
- Triggers on pull requests to `main`
- Manual trigger via GitHub Actions UI

**Production:**
- Triggers on GitHub releases
- Manual trigger via GitHub Actions UI

### Manual Deployments

```bash
# Deploy to staging
./scripts/deploy-staging.sh

# Deploy to production
./scripts/deploy-production.sh

# Verify deployments
./scripts/deploy-staging.sh --verify
./scripts/deploy-production.sh --verify
```

## 📊 Monitoring and Health Checks

### Health Check Endpoints

Both environments include health check endpoints:
- `http://localhost:3000/health` - Basic health check
- `http://localhost:3000/api/health` - Detailed health check

### Log Monitoring

```bash
# View staging logs
ssh root@134.199.159.190 'tail -f /root/deploy-staging/app.log'

# View production logs
ssh root@134.199.159.190 'tail -f /root/deploy-production/app.log'
```

### Status Checks

```bash
# Check application status
ssh root@134.199.159.190 'ps aux | grep next'

# Check database connectivity
ssh root@134.199.159.190 'cd /root/deploy-production && pnpm db:check'
```

## 🔄 Deployment Process

### Staging Deployment Flow

1. **Code Push** → `develop` branch
2. **GitHub Actions** → Run tests and validation
3. **Deploy** → Upload code to staging server
4. **Install** → Dependencies and build
5. **Migrate** → Database migrations
6. **Restart** → Application with new code
7. **Verify** → Health checks and domain access

### Production Deployment Flow

1. **Release** → Create GitHub release
2. **GitHub Actions** → Run comprehensive tests
3. **Backup** → Create backup of current deployment
4. **Deploy** → Upload code to production server
5. **Install** → Dependencies and build
6. **Migrate** → Database migrations (with rollback on failure)
7. **Restart** → Graceful application restart
8. **Verify** → Health checks and domain access
9. **Monitor** → Post-deployment monitoring

## 🛠️ Troubleshooting

### Common Issues

**1. SSH Connection Failed**
```bash
# Test SSH connection
ssh -i ~/.ssh/github_actions_deploy root@134.199.159.190

# Check SSH key permissions
chmod 600 ~/.ssh/github_actions_deploy
```

**2. Environment Validation Failed**
```bash
# Check environment file
cat .env.staging

# Validate again
tsx scripts/validate-env.ts staging
```

**3. Database Migration Failed**
```bash
# Check database connection
ssh root@134.199.159.190 'cd /root/deploy-staging && pnpm db:check'

# Manual migration
ssh root@134.199.159.190 'cd /root/deploy-staging && pnpm db:push'
```

**4. Application Not Starting**
```bash
# Check logs
ssh root@134.199.159.190 'tail -f /root/deploy-staging/app.log'

# Check port availability
ssh root@134.199.159.190 'netstat -tlnp | grep 3000'
```

### Rollback Procedures

**Staging Rollback:**
```bash
ssh root@134.199.159.190 << 'EOF'
cd /root/backups
LATEST_BACKUP=$(ls -t | head -1)
rm -rf /root/deploy-staging
cp -r "$LATEST_BACKUP/deploy-staging" /root/
cd /root/deploy-staging
pnpm start
EOF
```

**Production Rollback:**
```bash
ssh root@134.199.159.190 << 'EOF'
cd /root/backups
LATEST_BACKUP=$(ls -t | head -1)
rm -rf /root/deploy-production
cp -r "$LATEST_BACKUP/deploy-production" /root/
cd /root/deploy-production
pnpm start
EOF
```

## 📈 Performance Optimization

### Server Configuration

```bash
# Increase file limits
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# Optimize PostgreSQL
sudo -u postgres psql -c "ALTER SYSTEM SET shared_buffers = '256MB';"
sudo -u postgres psql -c "ALTER SYSTEM SET effective_cache_size = '1GB';"
sudo systemctl restart postgresql
```

### Application Optimization

- Use production build (`pnpm build`)
- Enable gzip compression
- Configure proper caching headers
- Monitor memory usage and database connections

## 🔒 Security Considerations

### Server Security

1. **Firewall Configuration:**
```bash
# Allow only necessary ports
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```

2. **SSL/TLS Setup:**
```bash
# Install Certbot for Let's Encrypt
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d chat.sayers.app -d testchat.sayers.app
```

3. **Regular Updates:**
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y
```

### Application Security

- Use strong authentication secrets
- Enable HTTPS in production
- Implement rate limiting
- Regular security audits
- Monitor for vulnerabilities

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [PostgreSQL Configuration](https://www.postgresql.org/docs/current/runtime-config.html)
- [SSL/TLS Setup with Let's Encrypt](https://letsencrypt.org/getting-started/)

## 🆘 Support

If you encounter issues:

1. Check the GitHub Actions logs
2. Review server logs
3. Validate environment configuration
4. Test SSH connectivity
5. Verify database connectivity

For additional help, check the troubleshooting section above or create an issue in the repository.

