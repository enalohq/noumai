#!/usr/bin/env node

/**
 * Database setup script for GEO/AEO Tracker
 * Run this script to set up the database and create initial admin user
 */

const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise(resolve => rl.question(query, resolve));

async function setupDatabase() {
  console.log('🚀 Setting up GEO/AEO Tracker Database...\n');
  
  try {
    // Check if .env file exists
    if (!fs.existsSync('.env')) {
      console.log('⚠️  No .env file found. Creating from template...');
      if (fs.existsSync('.env.example')) {
        fs.copyFileSync('.env.example', '.env');
        console.log('✅ Created .env file from template');
      } else {
        console.log('❌ .env.example not found. Please create a .env file manually.');
        return;
      }
    }
    
    console.log('\n📦 Installing dependencies...');
    try {
      execSync('npm install', { stdio: 'inherit' });
    } catch (error) {
      console.log('⚠️  Some dependencies might have failed to install. Continuing...');
    }
    
    console.log('\n🔧 Setting up database...');
    
    // Generate Prisma client
    console.log('📦 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Push database schema
    console.log('🚀 Pushing database schema...');
    execSync('npx prisma db push', { stdio: 'inherit' });
    
    console.log('\n✅ Database setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Run: npm run dev');
    console.log('2. Open http://localhost:3000 in your browser');
    console.log('\nFor production, make sure to:');
    console.log('1. Set secure AUTH_SECRET in .env');
    console.log('2. Update DATABASE_URL to your PostgreSQL connection');
    console.log('3. Set up environment variables for production');
    
  } catch (error) {
    console.error('❌ Error during setup:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run setup
setupDatabase().catch(console.error);