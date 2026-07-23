#!/bin/bash

# ==============================================================================
# Venueza ERP - Setup Cron Jobs for Automated Backups
# RUN THIS AS ROOT on the production server.
# ==============================================================================

set -e

BACKUP_SCRIPT="/var/www/venueza/deployment/backup/backup.sh"

if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo "Error: Backup script not found at $BACKUP_SCRIPT"
    echo "Make sure the repository is cloned to /var/www/venueza"
    exit 1
fi

chmod +x "$BACKUP_SCRIPT"
chmod +x /var/www/venueza/deployment/backup/restore.sh

# Create the cron configuration file
CRON_FILE="/etc/cron.d/venueza_backups"

echo "Configuring cron jobs..."

cat > "$CRON_FILE" << EOF
# Venueza ERP Automated Backup System
# Log file: /var/log/venueza_backup.log

# Run DAILY backup at 2:00 AM every day
0 2 * * * root $BACKUP_SCRIPT daily >> /var/log/venueza_backup.log 2>&1

# Run WEEKLY backup at 3:00 AM every Sunday
0 3 * * 0 root $BACKUP_SCRIPT weekly >> /var/log/venueza_backup.log 2>&1

# Run MONTHLY backup at 4:00 AM on the 1st of every month
0 4 1 * * root $BACKUP_SCRIPT monthly >> /var/log/venueza_backup.log 2>&1
EOF

chmod 644 "$CRON_FILE"
systemctl restart cron

echo "Cron jobs successfully installed at $CRON_FILE"
echo "Backups will be stored in /var/backups/venueza/"
