#!/bin/bash

# ==============================================================================
# Venueza ERP - Zero Downtime Deployment Script
# Run this inside your project root directory on the VPS (e.g., /var/www/venueza)
# ==============================================================================

set -e

echo "Starting Deployment Process..."

# 1. Pull latest changes
echo "Pulling latest code from git..."
git pull origin main

# 2. Update Backend
echo "Updating Backend..."
cd server
npm install
# Restart PM2 process (assuming it's named 'venueza-backend')
# If it's the first time, run: pm2 start index.js --name "venueza-backend"
pm2 restart venueza-backend || pm2 start index.js --name "venueza-backend"
cd ..

# 3. Update Frontend
echo "Updating Frontend..."
npm install
npm run build

echo "Deployment Successful!"
