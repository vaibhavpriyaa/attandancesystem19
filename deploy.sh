#!/bin/bash

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."

# Try to deploy with a specific project name
vercel --prod --name attendance-system --yes

# If that fails, try without project name
if [ $? -ne 0 ]; then
    echo "Retrying deployment without project name..."
    vercel --prod --yes
fi

echo "✅ Deployment completed!" 