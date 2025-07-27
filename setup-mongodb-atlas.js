#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🗄️  MongoDB Atlas Setup for Attendance Management System');
console.log('=======================================================');
console.log('');

console.log('📝 This script will help you set up MongoDB Atlas (cloud database)');
console.log('   This is often easier than local installation and provides:');
console.log('   ✅ No local installation required');
console.log('   ✅ Automatic backups');
console.log('   ✅ High availability');
console.log('   ✅ Free tier available');
console.log('');

console.log('🚀 Steps to set up MongoDB Atlas:');
console.log('');
console.log('1. Go to https://www.mongodb.com/atlas');
console.log('2. Click "Try Free" and create an account');
console.log('3. Create a new cluster (choose the free tier)');
console.log('4. Set up database access (create a username/password)');
console.log('5. Set up network access (allow access from anywhere: 0.0.0.0/0)');
console.log('6. Get your connection string');
console.log('');

console.log('💡 Alternative: Use MongoDB Atlas connection string directly');
console.log('   If you already have a MongoDB Atlas connection string,');
console.log('   you can enter it below.');
console.log('');

rl.question('Do you want to proceed with MongoDB Atlas setup? (y/n): ', (answer) => {
  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    console.log('');
    console.log('📋 Please follow these steps:');
    console.log('');
    console.log('1. Open https://www.mongodb.com/atlas in your browser');
    console.log('2. Sign up for a free account');
    console.log('3. Create a new cluster (M0 Free tier)');
    console.log('4. In the cluster, click "Connect"');
    console.log('5. Choose "Connect your application"');
    console.log('6. Copy the connection string');
    console.log('7. Replace <password> with your database password');
    console.log('8. Replace <dbname> with "attendance-system"');
    console.log('');
    
    rl.question('Enter your MongoDB Atlas connection string (or press Enter to skip): ', (connectionString) => {
      if (connectionString.trim()) {
        // Update the .env file
        const envPath = path.join(__dirname, 'server', '.env');
        let envContent = '';
        
        try {
          envContent = fs.readFileSync(envPath, 'utf8');
        } catch (error) {
          console.log('📝 Creating new .env file...');
        }
        
        // Update or add MONGODB_URI
        const lines = envContent.split('\n');
        let updated = false;
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('MONGODB_URI=')) {
            lines[i] = `MONGODB_URI=${connectionString.trim()}`;
            updated = true;
            break;
          }
        }
        
        if (!updated) {
          lines.push(`MONGODB_URI=${connectionString.trim()}`);
        }
        
        fs.writeFileSync(envPath, lines.join('\n'));
        
        console.log('✅ MongoDB Atlas connection string updated in server/.env');
        console.log('');
        console.log('🔄 Please restart your server to connect to MongoDB Atlas:');
        console.log('   npm run server');
        console.log('');
        console.log('🎉 Your attendance system will now use MongoDB Atlas!');
      } else {
        console.log('');
        console.log('📝 No connection string provided. You can:');
        console.log('   1. Set up MongoDB Atlas manually and update server/.env');
        console.log('   2. Continue using the system without database (development mode)');
        console.log('   3. Try local MongoDB installation later');
      }
      
      rl.close();
    });
  } else {
    console.log('');
    console.log('📝 Setup cancelled. Your system will continue to work in development mode.');
    console.log('   You can install MongoDB later or use MongoDB Atlas.');
    rl.close();
  }
}); 