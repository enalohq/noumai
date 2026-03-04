#!/usr/bin/env node

/**
 * Test script to verify Prisma 7+ configuration
 */

console.log('🔧 Testing Prisma 7+ Configuration...\n');

const fs = require('fs');
const path = require('path');

// Check Prisma schema
console.log('1. Checking Prisma schema...');
const prismaSchemaPath = path.join(__dirname, '../prisma/schema.prisma');
if (fs.existsSync(prismaSchemaPath)) {
  const schemaContent = fs.readFileSync(prismaSchemaPath, 'utf8');
  
  // Check for Prisma 7+ format (no url in datasource)
  if (schemaContent.includes('url      = env("DATABASE_URL")')) {
    console.log('❌ Prisma schema still has URL field (Prisma 6 format)');
    console.log('   Remove the URL field from the datasource block');
  } else {
    console.log('✅ Prisma schema is in Prisma 7+ format');
  }
  
  // Check provider
  if (schemaContent.includes('provider = "sqlite"')) {
    console.log('✅ Database provider: SQLite');
  } else if (schemaContent.includes('provider = "postgresql"')) {
    console.log('✅ Database provider: PostgreSQL');
  } else {
    console.log('❌ No database provider found in schema');
  }
} else {
  console.log('❌ Prisma schema file not found');
}

// Check environment variables
console.log('\n2. Checking environment variables...');
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const dbUrlMatch = envContent.match(/DATABASE_URL=(.*)/);
  
  if (dbUrlMatch) {
    const dbUrl = dbUrlMatch[1].replace(/"/g, '');
    console.log(`✅ DATABASE_URL found: ${dbUrl}`);
    
    // Check if it's SQLite or PostgreSQL
    if (dbUrl.startsWith('file:')) {
      console.log('✅ Using SQLite database');
      
      // Check if database file exists
      const dbPath = dbUrl.replace('file:', '').trim();
      const fullPath = path.join(__dirname, '..', dbPath);
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        console.log(`✅ Database file exists: ${fullPath}`);
        console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
      } else {
        console.log(`⚠️  Database file doesn't exist yet: ${fullPath}`);
        console.log('   It will be created when you run "npx prisma db push"');
      }
    } else if (dbUrl.includes('postgresql://')) {
      console.log('✅ Using PostgreSQL database');
      // Mask password for security
      const maskedUrl = dbUrl.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
      console.log(`   Connection: ${maskedUrl}`);
    }
  } else {
    console.log('❌ DATABASE_URL not found in .env');
  }
} else {
  console.log('⚠️  .env file not found');
  console.log('   Create one from .env.example');
}

// Check Prisma client configuration
console.log('\n3. Checking Prisma client configuration...');
const prismaClientPath = path.join(__dirname, '../lib/prisma.ts');
if (fs.existsSync(prismaClientPath)) {
  const clientContent = fs.readFileSync(prismaClientPath, 'utf8');
  
  if (clientContent.includes('datasource: {')) {
    console.log('✅ Prisma client is configured for Prisma 7+');
  } else {
    console.log('❌ Prisma client not configured for Prisma 7+');
    console.log('   Update lib/prisma.ts to pass datasource URL to PrismaClient');
  }
} else {
  console.log('❌ Prisma client configuration not found');
}

// Check NextAuth configuration
console.log('\n4. Checking NextAuth configuration...');
const nextAuthPath = path.join(__dirname, '../app/api/auth/[...nextauth]/route.ts');
if (fs.existsSync(nextAuthPath)) {
  const nextAuthContent = fs.readFileSync(nextAuthPath, 'utf8');
  
  if (nextAuthContent.includes('import { prisma } from "@/lib/prisma"')) {
    console.log('✅ NextAuth is using the Prisma client');
  } else {
    console.log('❌ NextAuth not configured to use Prisma client');
  }
} else {
  console.log('❌ NextAuth configuration not found');
}

console.log('\n📋 Summary:');
console.log('===========');
console.log('If all checks pass, run:');
console.log('1. npx prisma generate');
console.log('2. npx prisma db push');
console.log('3. npm run dev');
console.log('\nFor help with Prisma 7+, see:');
console.log('https://pris.ly/d/prisma7-client-config');