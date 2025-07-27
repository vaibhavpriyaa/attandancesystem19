#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🗄️  MongoDB Setup for Attendance Management System\n');

console.log('📋 MongoDB Setup Options:');
console.log('1. Install MongoDB locally (recommended for development)');
console.log('2. Use MongoDB Atlas (cloud - free tier)');
console.log('3. Skip for now (manual setup later)\n');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Choose an option (1-3): ', (answer) => {
  switch(answer.trim()) {
    case '1':
      setupLocalMongoDB();
      break;
    case '2':
      setupMongoDBAtlas();
      break;
    case '3':
      skipSetup();
      break;
    default:
      console.log('Invalid option. Please run the script again.');
      rl.close();
  }
});

function setupLocalMongoDB() {
  console.log('\n🔧 Setting up local MongoDB...');
  
  try {
    // Check if Homebrew is installed
    execSync('brew --version', { stdio: 'ignore' });
    console.log('✅ Homebrew is installed');
    
    // Install MongoDB
    console.log('📦 Installing MongoDB...');
    execSync('brew tap mongodb/brew', { stdio: 'inherit' });
    execSync('brew install mongodb-community', { stdio: 'inherit' });
    
    // Start MongoDB service
    console.log('🚀 Starting MongoDB service...');
    execSync('brew services start mongodb/brew/mongodb-community', { stdio: 'inherit' });
    
    console.log('✅ MongoDB installed and started successfully!');
    console.log('📝 Update your .env file with: MONGODB_URI=mongodb://localhost:27017/attendance-system');
    
  } catch (error) {
    console.error('❌ Error setting up MongoDB:', error.message);
    console.log('💡 Manual installation steps:');
    console.log('   1. Install Homebrew: /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"');
    console.log('   2. Install MongoDB: brew tap mongodb/brew && brew install mongodb-community');
    console.log('   3. Start MongoDB: brew services start mongodb/brew/mongodb-community');
  }
  
  rl.close();
}

function setupMongoDBAtlas() {
  console.log('\n☁️  Setting up MongoDB Atlas...');
  console.log('📋 Steps to set up MongoDB Atlas:');
  console.log('1. Go to https://www.mongodb.com/atlas');
  console.log('2. Create a free account');
  console.log('3. Create a new cluster (free tier)');
  console.log('4. Create a database user with username and password');
  console.log('5. Get your connection string');
  console.log('6. Update your .env file with the connection string\n');
  
  rl.question('Enter your MongoDB Atlas connection string: ', (connectionString) => {
    if (connectionString.trim()) {
      updateEnvFile(connectionString.trim());
    } else {
      console.log('⚠️  No connection string provided. Please update .env file manually.');
    }
    rl.close();
  });
}

function skipSetup() {
  console.log('\n⏭️  Skipping MongoDB setup');
  console.log('📝 Remember to:');
  console.log('   1. Install MongoDB locally, or');
  console.log('   2. Set up MongoDB Atlas, or');
  console.log('   3. Update MONGODB_URI in your .env file');
  rl.close();
}

function updateEnvFile(connectionString) {
  const envPath = path.join(__dirname, 'server', '.env');
  
  try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent = envContent.replace(
      /MONGODB_URI=.*/,
      `MONGODB_URI=${connectionString}`
    );
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file updated successfully!');
  } catch (error) {
    console.error('❌ Error updating .env file:', error.message);
    console.log('📝 Please manually update MONGODB_URI in server/.env file');
  }
}

console.log('\n🔗 Useful MongoDB commands:');
console.log('  mongod                    - Start MongoDB server');
console.log('  mongo                     - Connect to MongoDB shell');
console.log('  brew services start mongodb/brew/mongodb-community  - Start MongoDB service');
console.log('  brew services stop mongodb/brew/mongodb-community   - Stop MongoDB service'); 