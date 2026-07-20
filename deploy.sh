#!/bin/bash

echo "Starting deployment..."

# Pull latest changes
git pull origin master
if [ $? -ne 0 ]; then
    echo "❌ Git pull failed. Aborting deployment."
    exit 1
fi

# Install dependencies if needed
npm install
if [ $? -ne 0 ]; then
    echo "❌ NPM install failed. Aborting deployment."
    exit 1
fi

# Build the Next.js application
echo "Building application..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed! PM2 will NOT be restarted. The old version is still running."
    exit 1
fi

# Restart PM2 processes only if build succeeds
echo "✅ Build successful! Restarting PM2 processes..."
pm2 restart np-web np-worker

echo "🎉 Deployment completed successfully!"
