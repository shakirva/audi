#!/bin/bash

# ==============================================================================
# Venueza ERP - Initial VPS Setup Script (Ubuntu 24.04)
# RUN THIS SCRIPT AS ROOT OR WITH SUDO
# ==============================================================================

set -e # Exit immediately if a command exits with a non-zero status

# 1. Update system packages
echo "Updating system packages..."
apt update && apt upgrade -y

# 2. Install essential dependencies
echo "Installing essential dependencies..."
apt install -y curl wget git ufw nginx unzip certbot python3-certbot-nginx

# 3. Install Node.js (v20)
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 4. Install PM2 (Process Manager)
echo "Installing PM2..."
npm install -g pm2

# 5. Install PostgreSQL (Optional: if you use it on the same server)
echo "Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib

# 6. Configure UFW (Firewall)
echo "Configuring UFW Firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "=============================================================================="
echo "Basic Setup Complete!"
echo "Next Steps:"
echo "1. Set up your PostgreSQL database (if using a local DB)."
echo "2. Clone your repository to /var/www/venueza"
echo "3. Copy your .env file into /var/www/venueza/server"
echo "4. Copy the deployment/nginx.conf to /etc/nginx/sites-available/venueza"
echo "5. Run the deploy.sh script to start the app!"
echo "=============================================================================="
