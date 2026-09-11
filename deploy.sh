#!/bin/bash
set -e

# ==============================================================================
# VENUEZA DEPLOYMENT ARCHITECTURE
#
# PRODUCTION
# Domain: venueza.cloud
# Root Directory: /var/www/venueza
# PM2 Process: venueza
# Port: 5005
#
# STAGING
# Domain: dev.venueza.cloud
# Root Directory: /var/www/venueza-staging
# PM2 Process: venueza-staging
# Port: 5010
# ==============================================================================

# 1. Require Explicit Target
TARGET_ENV=$1
if [ -z "$TARGET_ENV" ]; then
    echo "❌ ERROR: No target environment specified."
    echo "Usage: ./deploy.sh production OR ./deploy.sh staging"
    exit 1
fi

if [ "$TARGET_ENV" != "production" ] && [ "$TARGET_ENV" != "staging" ]; then
    echo "❌ ERROR: Invalid target environment '$TARGET_ENV'."
    echo "Usage: ./deploy.sh production OR ./deploy.sh staging"
    exit 1
fi

# 2. Derive Configuration
COMMIT_SHA=$(git rev-parse --short HEAD)
TIMESTAMP=$(date +%Y%m%d%H%M%S)
RELEASE_ID="${TIMESTAMP}-${COMMIT_SHA}"

if [ "$TARGET_ENV" = "production" ]; then
    DOMAIN="venueza.cloud"
    TARGET_DIR="/var/www/venueza"
    PM2_PROCESS="venueza"
    API_PORT="5005"
    NODE_ENV="production"
else
    DOMAIN="dev.venueza.cloud"
    TARGET_DIR="/var/www/venueza-staging"
    PM2_PROCESS="venueza-staging"
    API_PORT="5010"
    NODE_ENV="production" # The backend still runs in prod mode to behave correctly
fi

echo "🚀 Starting DEPLOYMENT to $TARGET_ENV"
echo "  • Release ID: $RELEASE_ID"
echo "  • Target Dir: $TARGET_DIR"
echo "  • PM2 Process: $PM2_PROCESS"
echo "  • Domain: $DOMAIN"
echo "  • Port: $API_PORT"

# 3. Create Remote Release Directory Structure
echo "📁 Setting up remote directories..."
ssh venueza-vps "
    mkdir -p $TARGET_DIR/releases
    mkdir -p $TARGET_DIR/shared/uploads
    # Ensure shared .env exists
    if [ ! -f $TARGET_DIR/shared/.env ]; then
        if [ -f $TARGET_DIR/server/.env ]; then
            cp $TARGET_DIR/server/.env $TARGET_DIR/shared/.env
        else
            echo '❌ ERROR: No shared .env file found at $TARGET_DIR/shared/.env!'
            exit 1
        fi
    fi
" || exit 1

RELEASE_PATH="$TARGET_DIR/releases/$RELEASE_ID"

# 4. Rsync Source to New Release Directory
echo "⬇️ Syncing files to VPS ($RELEASE_PATH)..."
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude 'dist' \
    --exclude '.git' \
    --exclude '.env' \
    --exclude '.env.*' \
    --exclude 'server/.env' \
    --exclude 'server/.env.*' \
    --exclude 'server/public/uploads' \
    --exclude 'public/uploads' \
    ./ venueza-vps:$RELEASE_PATH/

# 5. Remote Build and Release Assembly
echo "⚙️ Executing remote build and assembly..."
ssh venueza-vps "
    set -e
    cd $RELEASE_PATH

    # Install root dependencies
    echo '📦 Installing root dependencies...'
    npm ci || npm install

    # Build Frontend
    echo '🏗️ Building React frontend...'
    export COMMIT_SHA=$COMMIT_SHA
    export RELEASE_ID=$RELEASE_ID
    export RELEASE_TIMESTAMP=$TIMESTAMP
    export NODE_ENV=$NODE_ENV
    npm run build
    
    # Create .env.release for backend
    echo "COMMIT_SHA=\"$COMMIT_SHA\"" > server/.env.release
    echo "RELEASE_ID=\"$RELEASE_ID\"" >> server/.env.release
    echo "RELEASE_TIMESTAMP=\"$TIMESTAMP\"" >> server/.env.release
    
    # Check if frontend built properly
    if [ ! -f dist/index.html ]; then
        echo '❌ ERROR: Frontend build failed, missing index.html'
        exit 1
    fi

    # SAFETY CHECK: Scan dist for localhost references
    echo '🔍 Scanning production build for unsafe localhost API references...'
    if grep -r -i -E 'http://localhost:[0-9]+|http://127\.0\.0\.1:[0-9]+' dist/; then
        echo '❌ PRODUCTION BUILD REJECTED: LOCALHOST API REFERENCE DETECTED!'
        exit 1
    else
        echo '✅ Build scan passed: No localhost references found in production frontend.'
    fi

    # Install server dependencies
    cd server
    echo '📦 Installing server dependencies...'
    npm ci || npm install

    # Link shared resources
    echo '🔗 Linking shared resources (.env, uploads)...'
    ln -sf $TARGET_DIR/shared/.env .env
    mkdir -p public
    ln -sf $TARGET_DIR/shared/uploads public/uploads

    # Nginx config test
    sudo nginx -t
" || exit 1

# 6. Atomic Switch and PM2 Restart
echo "🔄 Switching current release and restarting PM2..."
ssh venueza-vps "
    set -e
    
    # Record previous release for potential rollback
    PREV_RELEASE=\$(readlink $TARGET_DIR/current || echo '')
    echo \"\$PREV_RELEASE\" > $TARGET_DIR/shared/previous_release.txt

    # Atomic switch
    ln -sfn $RELEASE_PATH $TARGET_DIR/current

    cd $TARGET_DIR/current/server
    
    export COMMIT_SHA="$COMMIT_SHA"
    export RELEASE_ID="$RELEASE_ID"
    export RELEASE_TIMESTAMP="$TIMESTAMP"
    
    # Always delete and recreate PM2 process to pick up the new directory CWD
    if pm2 show $PM2_PROCESS > /dev/null 2>&1; then
        pm2 delete $PM2_PROCESS
    fi
    pm2 start index.js --name $PM2_PROCESS
    pm2 save

" || exit 1

# 7. Verification and Rollback Handling
echo "🔍 Validating deployment health..."

verify_deployment() {
    ssh venueza-vps "
        set -e
        # Wait 3 seconds for process to boot
        sleep 3
        
        # 1. PM2 Status
        STATUS=\$(pm2 jlist | node -e \"const fs = require('fs'); const input = fs.readFileSync(0, 'utf-8'); try { const data = JSON.parse(input); const app = data.find(p => p.name === '$PM2_PROCESS'); console.log(app ? app.pm2_env.status : 'not_found'); } catch(e) { console.log('error'); }\")
        if [ \"\$STATUS\" != \"online\" ]; then
            echo '❌ PM2 Process is not online. Status: '\$STATUS
            exit 1
        fi

        # 2. Localhost API Health
        HTTP_CODE=\$(curl -s -o /dev/null -w \"%{http_code}\" http://localhost:$API_PORT/api/health)
        if [ \"\$HTTP_CODE\" != \"200\" ]; then
            echo '❌ Localhost API Health Check Failed! HTTP Code: '\$HTTP_CODE
            exit 1
        fi

        # 3. Localhost API Version Check
        RUNNING_RELEASE=\$(curl -s http://localhost:$API_PORT/api/version | grep -o '\"release\":\"[^\"]*\"' | cut -d '\"' -f 4)
        if [ \"\$RUNNING_RELEASE\" != \"$RELEASE_ID\" ]; then
            echo '❌ API Version Mismatch! Expected $RELEASE_ID but got '\$RUNNING_RELEASE
            exit 1
        fi

        # 4. Live Domain API Health
        HTTP_CODE_PUB=\$(curl -s -o /dev/null -w \"%{http_code}\" https://$DOMAIN/api/health)
        if [ \"\$HTTP_CODE_PUB\" != \"200\" ]; then
            echo '❌ Live Domain API Health Check Failed! HTTP Code: '\$HTTP_CODE_PUB
            exit 1
        fi

        # 5. Live Domain Version Check
        PUB_RELEASE=\$(curl -s https://$DOMAIN/api/version | grep -o '\"release\":\"[^\"]*\"' | cut -d '\"' -f 4)
        if [ \"\$PUB_RELEASE\" != \"$RELEASE_ID\" ]; then
            echo '❌ Live Domain Version Mismatch! Expected $RELEASE_ID but got '\$PUB_RELEASE
            exit 1
        fi
        
        echo '✅ All health checks passed!'
    "
}

if ! verify_deployment; then
    echo "⚠️ DEPLOYMENT FAILED. INITIATING AUTOMATIC ROLLBACK..."
    ssh venueza-vps "
        set -e
        PREV_RELEASE=\$(cat $TARGET_DIR/shared/previous_release.txt || echo '')
        if [ -n \"\$PREV_RELEASE\" ] && [ -d \"\$PREV_RELEASE\" ]; then
            echo '⏪ Rolling back to: '\$PREV_RELEASE
            ln -sfn \$PREV_RELEASE $TARGET_DIR/current
            cd $TARGET_DIR/current/server
            if pm2 show $PM2_PROCESS > /dev/null 2>&1; then
                pm2 delete $PM2_PROCESS
            fi
            pm2 start index.js --name $PM2_PROCESS
            echo '🟢 AUTOMATIC ROLLBACK SUCCESSFUL'
        else
            echo '❌ NO PREVIOUS RELEASE TO ROLL BACK TO!'
            exit 1
        fi
    "
    exit 1
fi

echo ""
echo "=== DEPLOYMENT REPORT ==="
echo "🟢 $TARGET_ENV DEPLOYMENT ARCHITECTURE VERIFIED"
echo "Domain: https://$DOMAIN"
echo "PM2 Process: $PM2_PROCESS (Port $API_PORT)"
echo "Release ID: $RELEASE_ID"
echo "Deployed Commit: $COMMIT_SHA"
echo "Directory: $RELEASE_PATH"
echo "========================="
exit 0
