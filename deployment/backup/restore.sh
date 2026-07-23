#!/bin/bash

# ==============================================================================
# Venueza ERP - Disaster Recovery Restore Script
# Restores PostgreSQL database, Uploads, and Configurations from a backup.
# ==============================================================================

set -e

APP_DIR="/var/www/venueza"
DB_NAME="venueza_prod"
DB_USER="venueza"

if [ -z "$1" ]; then
    echo "Usage: ./restore.sh <backup_prefix>"
    echo "Example: ./restore.sh /var/backups/venueza/daily/venueza_daily_20260723_020000"
    exit 1
fi

PREFIX=$1

echo "WARNING: This will overwrite the current database and uploads."
read -p "Are you sure you want to proceed? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

echo "Starting Restoration Process..."

# 1. Stop Application (Prevent writing during restore)
echo "Stopping backend service..."
pm2 stop venueza-backend || true

# 2. Restore Database
DB_BACKUP="${PREFIX}_db.sql.gz"
if [ -f "$DB_BACKUP" ]; then
    echo "Restoring Database from $DB_BACKUP..."
    # Drop and recreate database
    sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;"
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
    
    # Unzip and restore
    gunzip -c "$DB_BACKUP" | sudo -u postgres psql -d $DB_NAME
    echo "Database restored successfully."
else
    echo "ERROR: Database backup file not found: $DB_BACKUP"
fi

# 3. Restore Uploads
UPLOADS_BACKUP="${PREFIX}_uploads.tar.gz"
if [ -f "$UPLOADS_BACKUP" ]; then
    echo "Restoring Uploads from $UPLOADS_BACKUP..."
    rm -rf "$APP_DIR/server/uploads"
    mkdir -p "$APP_DIR/server/uploads"
    tar -xzf "$UPLOADS_BACKUP" -C "$APP_DIR/server"
    echo "Uploads restored successfully."
else
    echo "WARNING: Uploads backup file not found, skipping."
fi

# 4. Restart Application
echo "Restarting backend service..."
pm2 start venueza-backend

echo "=============================================================================="
echo "Restore Process Completed Successfully."
echo "Please verify the application at http://your-domain.com"
echo "=============================================================================="
