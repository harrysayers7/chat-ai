#!/bin/bash

# Check Staging Deployment Status
echo "🔍 Checking staging deployment status..."

SERVER_IP="134.199.159.190"

echo ""
echo "📊 **Deployment Status Check**"
echo "================================"

# Check if server is reachable
echo "🌐 **Server Connectivity**"
if ping -c 1 $SERVER_IP > /dev/null 2>&1; then
    echo "✅ Server is reachable: $SERVER_IP"
else
    echo "❌ Server is not reachable: $SERVER_IP"
    exit 1
fi

# Check if application is running on the server
echo ""
echo "🚀 **Application Status**"
if curl -s --connect-timeout 5 "http://$SERVER_IP:3000" > /dev/null 2>&1; then
    echo "✅ Application is running on port 3000"
    echo "   Local URL: http://$SERVER_IP:3000"
else
    echo "❌ Application is not running on port 3000"
    echo "   💡 Run: ssh root@$SERVER_IP 'cd deploy-staging && ./remote-deploy.sh'"
fi

# Check DNS resolution
echo ""
echo "🌍 **DNS Resolution**"
if nslookup testchat.sayers.app > /dev/null 2>&1; then
    DNS_IP=$(nslookup testchat.sayers.app | grep "Address:" | tail -1 | awk '{print $2}')
    if [ "$DNS_IP" = "$SERVER_IP" ]; then
        echo "✅ DNS configured correctly: testchat.sayers.app → $DNS_IP"
    else
        echo "⚠️  DNS configured but pointing to wrong IP: testchat.sayers.app → $DNS_IP (should be $SERVER_IP)"
    fi
else
    echo "❌ DNS not configured for testchat.sayers.app"
    echo "   💡 Add A record: testchat.sayers.app → $SERVER_IP"
fi

# Test domain access
echo ""
echo "🔗 **Domain Access Test**"
if curl -s --connect-timeout 5 "http://testchat.sayers.app" > /dev/null 2>&1; then
    echo "✅ Domain is accessible: http://testchat.sayers.app"
    echo "   🎉 Your staging environment is LIVE!"
else
    echo "❌ Domain is not accessible: http://testchat.sayers.app"
    if [ "$DNS_IP" = "$SERVER_IP" ]; then
        echo "   💡 DNS is correct, but application might not be running"
        echo "   💡 Check server: ssh root@$SERVER_IP 'cd deploy-staging && ./remote-deploy.sh'"
    else
        echo "   💡 Configure DNS first: testchat.sayers.app → $SERVER_IP"
    fi
fi

echo ""
echo "📋 **Quick Commands**"
echo "====================="
echo "🔧 Deploy on server: ssh root@$SERVER_IP 'cd deploy-staging && ./remote-deploy.sh'"
echo "📊 Check server logs: ssh root@$SERVER_IP 'tail -f /root/deploy-staging/app.log'"
echo "🌐 Test locally: curl http://$SERVER_IP:3000"
echo "🔍 Check DNS: nslookup testchat.sayers.app"
