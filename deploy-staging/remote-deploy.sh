#!/bin/bash

echo "🚀 Starting remote deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Not in deployment directory"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Installing..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm not found. Installing..."
    npm install -g pnpm
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --prod

# Check if PostgreSQL is running
if ! sudo systemctl is-active --quiet postgresql; then
    echo "❌ PostgreSQL not running. Starting..."
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

# Set up environment
echo "⚙️  Setting up environment..."
export $(cat .env | grep -v '^#' | xargs)

# Run database migrations
echo "🗄️  Running database migrations..."
if command -v pnpm &> /dev/null; then
    pnpm staging:db:migrate
else
    echo "⚠️  pnpm not available, skipping migrations"
fi

# Start the application
echo "🚀 Starting application..."
echo "📋 Application will be available at:"
echo "   Local: http://localhost:3000"
echo "   Domain: http://testchat.sayers.app (after DNS setup)"
echo ""
echo "🔧 To run in background, use:"
echo "   nohup NODE_ENV=production pnpm start > app.log 2>&1 &"
echo ""
echo "📝 To view logs:"
echo "   tail -f app.log"
echo ""

# Start the app
NODE_ENV=production pnpm start
