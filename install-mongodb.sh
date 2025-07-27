#!/bin/bash

echo "🗄️  Installing MongoDB for Attendance Management System"
echo "=================================================="

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "📦 Installing Homebrew first..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH
    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
    eval "$(/opt/homebrew/bin/brew shellenv)"
else
    echo "✅ Homebrew is already installed"
fi

# Install MongoDB
echo "📦 Installing MongoDB..."
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
echo "🚀 Starting MongoDB service..."
brew services start mongodb/brew/mongodb-community

# Wait a moment for MongoDB to start
sleep 3

# Check if MongoDB is running
if pgrep -x "mongod" > /dev/null; then
    echo "✅ MongoDB is running successfully!"
    echo "📝 MongoDB is now available at: mongodb://localhost:27017"
    echo "📝 Your attendance system database will be: attendance-system"
else
    echo "❌ MongoDB failed to start. Please check the logs."
    echo "💡 You can try starting it manually with: brew services start mongodb/brew/mongodb-community"
fi

echo ""
echo "🎉 MongoDB installation completed!"
echo "📋 Next steps:"
echo "   1. Restart your terminal to ensure Homebrew is in PATH"
echo "   2. Run: npm run dev (to start the attendance system)"
echo "   3. Open http://localhost:3000 in your browser"
echo ""
echo "🔗 Useful MongoDB commands:"
echo "   brew services start mongodb/brew/mongodb-community  - Start MongoDB"
echo "   brew services stop mongodb/brew/mongodb-community   - Stop MongoDB"
echo "   brew services restart mongodb/brew/mongodb-community - Restart MongoDB"
echo "   mongo attendance-system                            - Connect to database" 