#!/bin/bash
echo "🚀 Starting deployment to Venueza Hostinger VPS..."

# This script connects to the Hostinger VPS via SSH and runs the necessary commands to update production
ssh venueza-vps "cd /var/www/venueza && \
echo '⬇️ Pulling latest code from GitHub...' && git pull && \
echo '📦 Installing dependencies...' && npm install && \
echo '🏗️ Building React frontend...' && npm run build && \
echo '🔄 Restarting Node.js backend (PM2)...' && pm2 restart venueza-backend"

echo "✅ Deployment fully completed!"
