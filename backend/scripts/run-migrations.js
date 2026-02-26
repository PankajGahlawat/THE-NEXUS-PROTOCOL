#!/usr/bin/env node
/**
 * Database Migration Runner
 * Runs all SQL migration files in order
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Database = require('../models/database');

async function runMigrations() {
  const db = new Database();
  
  try {
    console.log('🔄 Starting database migrations...\n');
    
    // Initialize database connection
    await db.initialize();
    console.log('✓ Database connection established\n');
    
    // Get all migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    console.log(`Found ${files.length} migration files:\n`);
    
    for (const file of files) {
      console.log(`📄 Running migration: ${file}`);
      
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      
      try {
        await db.query(sql);
        console.log(`✓ ${file} completed successfully\n`);
      } catch (error) {
        console.error(`✗ ${file} failed:`, error.message);
        throw error;
      }
    }
    
    console.log('✅ All migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

// Run migrations
runMigrations();
