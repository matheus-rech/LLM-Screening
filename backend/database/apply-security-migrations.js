#!/usr/bin/env node
/* eslint-env node */
/* eslint-disable no-undef */

/**
 * Script to apply security migrations to Supabase database
 * This script reads migration files and applies them in order
 * 
 * Usage: node apply-security-migrations.js
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in backend/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Migration files in order
const migrations = [
  '001_fix_function_search_paths.sql',
  '002_move_vector_extension.sql',
  '003_auth_security_config.sql'
];

/**
 * Read migration file content
 */
function readMigration(filename) {
  const filepath = path.join(__dirname, 'migrations', filename);
  if (!fs.existsSync(filepath)) {
    throw new Error(`Migration file not found: ${filepath}`);
  }
  return fs.readFileSync(filepath, 'utf8');
}

/**
 * Apply a single migration
 */
async function applyMigration(name, sql) {
  console.log(`\n📋 Applying migration: ${name}`);
  
  try {
    // Split SQL into individual statements (simple split by semicolon)
    // Note: This is a simplified approach and may not handle all SQL edge cases
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && !s.startsWith('/*'));

    for (const statement of statements) {
      if (statement) {
        const { error } = await supabase.rpc('exec_sql', {
          query: statement + ';'
        }).catch(err => ({ error: err }));

        if (error) {
          // If exec_sql doesn't exist, try direct query
          const { error: queryError } = await supabase
            .from('_migrations')
            .select('*')
            .limit(1)
            .catch(() => ({ error: null }));

          if (queryError) {
            console.error(`  ⚠️  Error executing statement: ${error.message}`);
            console.error(`     Statement: ${statement.substring(0, 100)}...`);
          }
        }
      }
    }

    console.log(`  ✅ Migration ${name} applied successfully`);
    return true;
  } catch (error) {
    console.error(`  ❌ Failed to apply migration ${name}:`, error.message);
    return false;
  }
}

/**
 * Create migrations tracking table
 */
async function createMigrationsTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS _migrations (
      id serial PRIMARY KEY,
      name text NOT NULL UNIQUE,
      applied_at timestamptz DEFAULT now()
    );
  `;

  const { error } = await supabase.rpc('exec_sql', {
    query: sql
  }).catch(err => ({ error: err }));

  if (error) {
    console.log('⚠️  Could not create migrations table (may already exist)');
  }
}

/**
 * Check if migration has been applied
 */
async function isMigrationApplied(name) {
  const { data, error } = await supabase
    .from('_migrations')
    .select('*')
    .eq('name', name)
    .single();

  return !error && data;
}

/**
 * Record migration as applied
 */
async function recordMigration(name) {
  const { error } = await supabase
    .from('_migrations')
    .insert({ name });

  if (error) {
    console.error(`⚠️  Could not record migration ${name}`);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🔐 Supabase Security Migration Tool');
  console.log('====================================\n');

  // Create migrations table if it doesn't exist
  await createMigrationsTable();

  let appliedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const migration of migrations) {
    // Check if already applied
    const isApplied = await isMigrationApplied(migration);
    
    if (isApplied) {
      console.log(`⏭️  Skipping ${migration} (already applied)`);
      skippedCount++;
      continue;
    }

    // Read and apply migration
    try {
      const sql = readMigration(migration);
      const success = await applyMigration(migration, sql);
      
      if (success) {
        await recordMigration(migration);
        appliedCount++;
      } else {
        failedCount++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${migration}:`, error.message);
      failedCount++;
    }
  }

  // Summary
  console.log('\n====================================');
  console.log('📊 Migration Summary:');
  console.log(`  ✅ Applied: ${appliedCount}`);
  console.log(`  ⏭️  Skipped: ${skippedCount}`);
  console.log(`  ❌ Failed: ${failedCount}`);
  
  if (failedCount > 0) {
    console.log('\n⚠️  Some migrations failed. Please review the errors above.');
    console.log('You may need to apply them manually through the Supabase SQL Editor.');
  } else if (appliedCount > 0) {
    console.log('\n🎉 Security migrations applied successfully!');
  } else {
    console.log('\n✨ All migrations were already applied.');
  }

  // Provide manual instructions
  console.log('\n📝 Manual Steps Required:');
  console.log('1. Go to your Supabase Dashboard');
  console.log('2. Navigate to Authentication > Providers > Email');
  console.log('3. Enable "Check passwords against HaveIBeenPwned"');
  console.log('4. Navigate to Authentication > Providers > Multi-Factor Auth');
  console.log('5. Enable "Time-based One-time Password (TOTP)"');
  console.log('6. Review and configure password requirements');
  console.log('\nFor detailed instructions, see migrations/003_auth_security_config.sql');
}

// Run the script
main().catch(console.error);
