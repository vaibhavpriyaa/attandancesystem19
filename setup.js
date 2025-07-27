#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Attendance Management System...\n');

// Check if Node.js is installed
try {
  const nodeVersion = execSync('node --version', { encoding: 'utf8' });
  console.log(`✅ Node.js version: ${nodeVersion.trim()}`);
} catch (error) {
  console.error('❌ Node.js is not installed. Please install Node.js first.');
  process.exit(1);
}

// Check if npm is installed
try {
  const npmVersion = execSync('npm --version', { encoding: 'utf8' });
  console.log(`✅ npm version: ${npmVersion.trim()}`);
} catch (error) {
  console.error('❌ npm is not installed. Please install npm first.');
  process.exit(1);
}

// Install dependencies
console.log('\n📦 Installing dependencies...');

try {
  // Install root dependencies
  console.log('Installing root dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  // Install server dependencies
  console.log('Installing server dependencies...');
  execSync('cd server && npm install', { stdio: 'inherit' });

  // Install client dependencies
  console.log('Installing client dependencies...');
  execSync('cd client && npm install', { stdio: 'inherit' });

  console.log('✅ All dependencies installed successfully!');
} catch (error) {
  console.error('❌ Error installing dependencies:', error.message);
  process.exit(1);
}

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, 'server', '.env');
const envExamplePath = path.join(__dirname, 'server', 'env.example');

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  console.log('\n📝 Creating .env file...');
  try {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created successfully!');
    console.log('⚠️  Please update the .env file with your configuration.');
  } catch (error) {
    console.error('❌ Error creating .env file:', error.message);
  }
}

// Check if MongoDB is running (optional)
console.log('\n🔍 Checking MongoDB connection...');
try {
  // This is a simple check - you might want to implement a more robust check
  console.log('⚠️  Please ensure MongoDB is running on your system.');
  console.log('   - For local MongoDB: mongod');
  console.log('   - For MongoDB Atlas: Update MONGODB_URI in .env file');
} catch (error) {
  console.log('⚠️  MongoDB check skipped.');
}

console.log('\n🎉 Setup completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Update the .env file in the server directory with your configuration');
console.log('2. Start MongoDB (if using local installation)');
console.log('3. Run the application: npm run dev');
console.log('4. Open http://localhost:3000 in your browser');
console.log('\n📚 For more information, see the README.md file');

console.log('\n🔗 Useful commands:');
console.log('  npm run dev          - Start both frontend and backend');
console.log('  npm run server       - Start backend only');
console.log('  npm run client       - Start frontend only');
console.log('  npm run build        - Build for production'); 