#!/bin/bash

echo "🚀 Setting up environment variables for Vercel deployment..."

# Create a simple vercel.json with environment variables
cat > vercel.json << 'EOF'
{
  "version": 2,
  "env": {
    "NODE_ENV": "production"
  },
  "builds": [
    {
      "src": "server/index.js",
      "use": "@vercel/node"
    },
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/server/index.js"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
EOF

echo "✅ Created vercel.json with NODE_ENV=production"
echo ""
echo "📝 Next steps:"
echo "1. Add your MongoDB URI and JWT secret in the Vercel dashboard"
echo "2. Deploy using: vercel --prod --yes"
echo ""
echo "🌐 Or use the Vercel dashboard:"
echo "   - Go to https://vercel.com/dashboard"
echo "   - Import your GitHub repository"
echo "   - Add environment variables in Settings"
echo "   - Deploy" 