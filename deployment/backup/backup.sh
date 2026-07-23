#!/bin/bash

# ==============================================================================
# Venueza ERP - Automated Backup Script
# Creates compressed backups of PostgreSQL, Uploads, and Configurations.
# Enforces retention policies (Daily, Weekly, Monthly).
# ==============================================================================

set -e

# Configuration
APP_DIR="/var/www/venueza"
BACKUP_ROOT="/var/backups/venueza"
DB_NAME="venueza_prod"
DB_USER="venueza"
LOG_FILE="/var/log/venueza_backup.log"

# Define backup type (daily, weekly, monthly)
TYPE=${1:-daily}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="$BACKUP_ROOT/$TYPE"
FILE_PREFIX="venueza_${TYPE}_${TIMESTAMP}"

# Create directories
mkdir -p "$BACKUP_DIR"

log() {
    echo "[$(date +"%Y-%m-%d %H:%M:%S")] [$TYPE] $1" | tee -a "$LOG_FILE"
}

log "Starting $TYPE backup..."

# 1. Database Backup
DB_BACKUP_PATH="$BACKUP_DIR/${FILE_PREFIX}_db.sql.gz"
log "Backing up PostgreSQL database: $DB_NAME..."
sudo -u postgres pg_dump $DB_NAME | gzip > "$DB_BACKUP_PATH"
log "Database backup successful: $(du -sh "$DB_BACKUP_PATH" | cut -f1)"

# 2. Uploads Backup
UPLOADS_DIR="$APP_DIR/server/uploads"
if [ -d "$UPLOADS_DIR" ]; then
    UPLOADS_BACKUP_PATH="$BACKUP_DIR/${FILE_PREFIX}_uploads.tar.gz"
    log "Backing up uploads folder..."
    tar -czf "$UPLOADS_BACKUP_PATH" -C "$APP_DIR/server" uploads
    log "Uploads backup successful: $(du -sh "$UPLOADS_BACKUP_PATH" | cut -f1)"
else
    log "Uploads folder not found, skipping."
fi

# 3. Configurations Backup
CONFIG_BACKUP_PATH="$BACKUP_DIR/${FILE_PREFIX}_config.tar.gz"
log "Backing up configurations..."
tar -czf "$CONFIG_BACKUP_PATH" \
    -C "$APP_DIR" server/.env deployment/ \
    -C /etc/nginx/sites-available venueza || true
log "Config backup successful: $(du -sh "$CONFIG_BACKUP_PATH" | cut -f1)"

# 4. Retention Policy Cleanup
log "Enforcing retention policy for $TYPE backups..."
if [ "$TYPE" = "daily" ]; then
    # Keep last 30 daily backups
    ls -dt $BACKUP_DIR/*_db.sql.gz | tail -n +31 | xargs -r rm -f
    ls -dt $BACKUP_DIR/*_uploads.tar.gz | tail -n +31 | xargs -r rm -f
    ls -dt $BACKUP_DIR/*_config.tar.gz | tail -n +31 | xargs -r rm -f
elif [ "$TYPE" = "weekly" ]; then
    # Keep last 12 weekly backups
    ls -dt $BACKUP_DIR/*_db.sql.gz | tail -n +13 | xargs -r rm -f
    ls -dt $BACKUP_DIR/*_uploads.tar.gz | tail -n +13 | xargs -r rm -f
    ls -dt $BACKUP_DIR/*_config.tar.gz | tail -n +13 | xargs -r rm -f
elif [ "$TYPE" = "monthly" ]; then
    # Keep last 12 monthly backups
    ls -dt $BACKUP_DIR/*_db.sql.gz | tail -n +13 | xargs -r rm -f
    ls -dt $BACKUP_DIR/*_uploads.tar.gz | tail -n +13 | xargs -r rm -f
    ls -dt $BACKUP_DIR/*_config.tar.gz | tail -n +13 | xargs -r rm -f
fi

# 5. External Storage Hook (For AWS S3, Cloudflare R2, etc.)
# If you configure AWS CLI, uncomment the line below:
# aws s3 sync $BACKUP_ROOT s3://your-venueza-backup-bucket/

log "Backup $TYPE completed successfully."
echo "---------------------------------------------------" >> "$LOG_FILE"
