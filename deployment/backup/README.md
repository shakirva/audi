# Venueza ERP - Backup & Disaster Recovery (BDR)

This module provides an enterprise-grade automated Backup & Disaster Recovery system for the Venueza SaaS platform.

## Overview

The system automatically backs up:
1. **PostgreSQL Database** (`venueza_prod`) via `pg_dump`
2. **Uploaded Files** (`server/uploads`) via `tar`
3. **Application Configurations** (`.env`, Nginx config, deployment scripts)

All backups are compressed using `gzip` to minimize disk space and are logged comprehensively.

## 📅 Backup Schedule & Retention Policy

The system uses standard Linux `cron` to run unattended. It automatically rotates and deletes old backups to prevent filling up the server disk.

*   **Daily Backups:** Runs every day at 2:00 AM. (Retains last 30 days)
*   **Weekly Backups:** Runs every Sunday at 3:00 AM. (Retains last 12 weeks)
*   **Monthly Backups:** Runs on the 1st of every month at 4:00 AM. (Retains last 12 months)

All backups are stored on the server at: `/var/backups/venueza/`

---

## 🚀 Installation (One-Time Setup)

To activate the automated backup system on your production server, SSH into your VPS as `root` and run:

```bash
cd /var/www/venueza/deployment/backup
chmod +x install_cron.sh
./install_cron.sh
```

You can test if the backup script works by running it manually:
```bash
./backup.sh daily
```

To view the backup logs:
```bash
cat /var/log/venueza_backup.log
```

---

## 🆘 Disaster Recovery (How to Restore)

If the database is corrupted, or you migrate to a new server and need to restore customer data, follow this one-step process.

1. Find the backup you want to restore.
```bash
ls -l /var/backups/venueza/daily/
```

2. Note the prefix of the file. For example, if your files are named:
   * `venueza_daily_20260723_020000_db.sql.gz`
   * `venueza_daily_20260723_020000_uploads.tar.gz`
   
   Your prefix is: `/var/backups/venueza/daily/venueza_daily_20260723_020000`

3. Run the restore script:
```bash
cd /var/www/venueza/deployment/backup
./restore.sh /var/backups/venueza/daily/venueza_daily_20260723_020000
```

The script will safely stop PM2, drop the current database, recreate it, restore the data, restore the uploads folder, and restart PM2 automatically.

---

## ☁️ External Cloud Storage Integration

To comply with true Disaster Recovery practices, backups should be pushed to an external cloud provider (e.g., AWS S3 or Cloudflare R2). 

To enable this:
1. Install AWS CLI on your server (`apt install awscli`).
2. Configure credentials (`aws configure`).
3. Open `backup.sh` and uncomment the sync line at the bottom:
   `aws s3 sync /var/backups/venueza/ s3://your-venueza-backup-bucket/`

This will automatically mirror your local backups to the cloud after every successful backup run.
