#!/usr/bin/env node

/**
 * Test script to verify authentication setup
 */

console.log('🔐 Testing Authentication Setup...\n');

// Check environment variables
console.log('1. Checking environment variables...');
const requiredEnvVars = ['AUTH_SECRET', 'NEXTAUTH_URL', 'DATABASE_URL'];
const missingEnvVars = [];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    missingEnvVars.push(envVar);
  }
}

if (missingEnvVars.length > 0) {
  console.log(`❌ Missing environment variables: ${missingEnvVars.join(', ')}`);
  console.log('   Please set these in your .env file');
} else {
  console.log('✅ All required environment variables are set');
}

// Check Prisma schema
console.log('\n2. Checking Prisma schema...');
const fs = require('fs');
const path = require('path');

const prismaSchemaPath = path.join(__dirname, '../prisma/schema.prisma');
if (fs.existsSync(prismaSchemaPath)) {
  const schemaContent = fs.readFileSync(prismaSchemaPath, 'utf8');
  const requiredModels = ['User', 'Account', 'Session', 'Workspace'];
  const missingModels = [];
  
  for (const model of requiredModels) {
    if (!schemaContent.includes(`model ${model}`)) {
      missingModels.push(model);
    }
  }
  
  if (missingModels.length > 0) {
    console.log(`❌ Missing Prisma models: ${missingModels.join(', ')}`);
  } else {
    console.log('✅ All required Prisma models are defined');
  }
} else {
  console.log('❌ Prisma schema file not found');
}

// Check API routes
console.log('\n3. Checking API routes...');
const apiRoutes = [
  '../app/api/auth/[...nextauth]/route.ts',
  '../app/api/auth/register/route.ts'
];

let allRoutesExist = true;
for (const route of apiRoutes) {
  const routePath = path.join(__dirname, route);
  if (!fs.existsSync(routePath)) {
    console.log(`❌ Missing API route: ${route}`);
    allRoutesExist = false;
  }
}

if (allRoutesExist) {
  console.log('✅ All API routes are present');
}

// Check UI components
console.log('\n4. Checking UI components...');
const uiComponents = [
  '../app/auth/signin/page.tsx',
  '../app/auth/signup/page.tsx',
  '../app/layout.tsx',
  '../app/page.tsx',
  '../middleware.ts'
];

let allComponentsExist = true;
for (const component of uiComponents) {
  const componentPath = path.join(__dirname, component);
  if (!fs.existsSync(componentPath)) {
    console.log(`❌ Missing component: ${component}`);
    allComponentsExist = false;
  }
}

if (allComponentsExist) {
  console.log('✅ All UI components are present');
}

// Summary
console.log('\n📋 Summary:');
console.log('===========');

if (missingEnvVars.length === 0 && allRoutesExist && allComponentsExist) {
  console.log('✅ Authentication setup appears to be complete!');
  console.log('\nNext steps:');
  console.log('1. Run: npm run prisma:generate');
  console.log('2. Run: npm run prisma:push');
  console.log('3. Run: npm run prisma:seed (optional)');
  console.log('4. Run: npm run dev');
  console.log('5. Visit: http://localhost:3000/auth/signin');
} else {
  console.log('❌ Some issues were found with the authentication setup');
  console.log('\nPlease fix the issues above before proceeding.');
}

console.log('\n🔐 Authentication test complete.');