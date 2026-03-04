#!/usr/bin/env node

/**
 * Script to switch between SQLite and PostgreSQL databases
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise(resolve => rl.question(query, resolve));

const PRISMA_SCHEMA_PATH = path.join(__dirname, '../prisma/schema.prisma');
const ENV_PATH = path.join(__dirname, '../.env');
const ENV_EXAMPLE_PATH = path.join(__dirname, '../.env.example');

async function switchDatabase() {
  console.log('🔄 Database Configuration Switcher\n');
  
  console.log('Choose database type:');
  console.log('1. SQLite (Development)');
  console.log('2. PostgreSQL (Production)');
  console.log('3. View current configuration');
  console.log('4. Exit\n');
  
  const choice = await question('Enter your choice (1-4): ');
  
  switch (choice) {
    case '1':
      await configureSQLite();
      break;
    case '2':
      await configurePostgreSQL();
      break;
    case '3':
      await viewCurrentConfig();
      break;
    case '4':
      console.log('Goodbye!');
      rl.close();
      return;
    default:
      console.log('❌ Invalid choice');
      rl.close();
      return;
  }
  
  rl.close();
}

async function configureSQLite() {
  console.log('\n🔧 Configuring for SQLite (Development)...\n');
  
  try {
    // Update Prisma schema (Prisma 7+ doesn't have url in schema)
    let schemaContent = fs.readFileSync(PRISMA_SCHEMA_PATH, 'utf8');
    schemaContent = schemaContent.replace(
      /datasource db \{[^}]*\}/s,
      `datasource db {
  provider = "sqlite"
}`
    );
    fs.writeFileSync(PRISMA_SCHEMA_PATH, schemaContent);
    console.log('✅ Updated Prisma schema for SQLite');
    
    // Update .env file if it exists
    if (fs.existsSync(ENV_PATH)) {
      let envContent = fs.readFileSync(ENV_PATH, 'utf8');
      envContent = envContent.replace(
        /DATABASE_URL=.*/,
        'DATABASE_URL="file:./dev.db"'
      );
      fs.writeFileSync(ENV_PATH, envContent);
      console.log('✅ Updated .env file for SQLite');
    }
    
    // Update .env.example
    if (fs.existsSync(ENV_EXAMPLE_PATH)) {
      let exampleContent = fs.readFileSync(ENV_EXAMPLE_PATH, 'utf8');
      exampleContent = exampleContent.replace(
        /DATABASE_URL=.*/,
        'DATABASE_URL="file:./dev.db"'
      );
      fs.writeFileSync(ENV_EXAMPLE_PATH, exampleContent);
      console.log('✅ Updated .env.example for SQLite');
    }
    
    console.log('\n📋 Next steps:');
    console.log('1. Run: npx prisma generate');
    console.log('2. Run: npx prisma db push');
    console.log('3. Run: npm run dev');
    
  } catch (error) {
    console.error('❌ Error configuring SQLite:', error.message);
  }
}

async function configurePostgreSQL() {
  console.log('\n🔧 Configuring for PostgreSQL (Production)...\n');
  
  try {
    // Update Prisma schema (Prisma 7+ doesn't have url in schema)
    let schemaContent = fs.readFileSync(PRISMA_SCHEMA_PATH, 'utf8');
    schemaContent = schemaContent.replace(
      /datasource db \{[^}]*\}/s,
      `datasource db {
  provider = "postgresql"
}`
    );
    fs.writeFileSync(PRISMA_SCHEMA_PATH, schemaContent);
    console.log('✅ Updated Prisma schema for PostgreSQL');
    
    // Get PostgreSQL connection details
    const host = await question('PostgreSQL host (default: localhost): ') || 'localhost';
    const port = await question('PostgreSQL port (default: 5432): ') || '5432';
    const database = await question('Database name (default: aeo_tracker): ') || 'aeo_tracker';
    const username = await question('Username (default: postgres): ') || 'postgres';
    const password = await question('Password: ');
    
    const connectionString = `postgresql://${username}:${password}@${host}:${port}/${database}?schema=public`;
    
    // Update .env file if it exists
    if (fs.existsSync(ENV_PATH)) {
      let envContent = fs.readFileSync(ENV_PATH, 'utf8');
      envContent = envContent.replace(
        /DATABASE_URL=.*/,
        `DATABASE_URL="${connectionString}"`
      );
      fs.writeFileSync(ENV_PATH, envContent);
      console.log('✅ Updated .env file for PostgreSQL');
    }
    
    // Update .env.example
    if (fs.existsSync(ENV_EXAMPLE_PATH)) {
      let exampleContent = fs.readFileSync(ENV_EXAMPLE_PATH, 'utf8');
      exampleContent = exampleContent.replace(
        /DATABASE_URL=.*/,
        'DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"'
      );
      fs.writeFileSync(ENV_EXAMPLE_PATH, exampleContent);
      console.log('✅ Updated .env.example for PostgreSQL');
    }
    
    console.log('\n📋 Next steps:');
    console.log('1. Ensure PostgreSQL is running');
    console.log('2. Create the database if it doesn\'t exist');
    console.log('3. Run: npx prisma generate');
    console.log('4. Run: npx prisma db push');
    console.log('5. Run: npm run build && npm start');
    
  } catch (error) {
    console.error('❌ Error configuring PostgreSQL:', error.message);
  }
}

async function viewCurrentConfig() {
  console.log('\n📊 Current Database Configuration\n');
  
  try {
    // Read Prisma schema
    const schemaContent = fs.readFileSync(PRISMA_SCHEMA_PATH, 'utf8');
    const providerMatch = schemaContent.match(/provider\s*=\s*"(\w+)"/);
    const provider = providerMatch ? providerMatch[1] : 'Unknown';
    
    console.log(`Prisma Schema Provider: ${provider}`);
    
    // Read .env file
    if (fs.existsSync(ENV_PATH)) {
      const envContent = fs.readFileSync(ENV_PATH, 'utf8');
      const dbUrlMatch = envContent.match(/DATABASE_URL=(.*)/);
      if (dbUrlMatch) {
        // Mask password in URL for security
        const url = dbUrlMatch[1].replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
        console.log(`Environment DATABASE_URL: ${url}`);
      } else {
        console.log('DATABASE_URL not found in .env');
      }
    } else {
      console.log('.env file not found');
    }
    
    // Check if database file exists (for SQLite)
    if (provider === 'sqlite') {
      const dbPath = path.join(__dirname, '../prisma/dev.db');
      if (fs.existsSync(dbPath)) {
        const stats = fs.statSync(dbPath);
        console.log(`SQLite database file: ${dbPath}`);
        console.log(`Database size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`Last modified: ${stats.mtime}`);
      } else {
        console.log('SQLite database file not found');
      }
    }
    
    console.log('\n💡 Tip: Run "npx prisma studio" to view database contents');
    
  } catch (error) {
    console.error('❌ Error reading configuration:', error.message);
  }
}

// Run the script
switchDatabase().catch(console.error);