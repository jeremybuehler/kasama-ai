#!/usr/bin/env node

/**
 * Database Setup Script for Kasama AI
 * Runs Supabase migrations and verifies database health
 */

import { execSync } from 'child_process';
import fs from 'fs';
import https from 'https';

const CONFIG = {
  SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
  MIGRATIONS_PATH: './supabase/migrations',
  LOG_FILE: './database-setup.log'
};

class DatabaseSetup {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      migrations: [],
      verification: {},
      overall: 'pending'
    };
  }

  async runSetup() {
    console.log('🗄️  Starting Database Setup...\n');
    
    try {
      // 1. Verify Supabase configuration
      this.verifySupabaseConfig();
      
      // 2. List available migrations
      await this.listMigrations();
      
      // 3. Test database connectivity
      await this.testDatabaseConnection();
      
      // 4. Run migrations (if Supabase CLI is available)
      await this.runMigrations();
      
      // 5. Verify schema
      await this.verifySchema();
      
      // 6. Test RLS policies
      await this.testRLSPolicies();
      
      // Generate summary
      this.generateSummary();
      
    } catch (error) {
      console.error('❌ Database setup failed:', error);
      this.results.overall = 'failed';
    }
    
    // Save results
    this.saveResults();
    
    return this.results;
  }

  verifySupabaseConfig() {
    console.log('🔧 Verifying Supabase configuration...');
    
    const checks = [
      { name: 'SUPABASE_URL', value: CONFIG.SUPABASE_URL },
      { name: 'SUPABASE_ANON_KEY', value: CONFIG.SUPABASE_ANON_KEY }
    ];
    
    for (const check of checks) {
      if (!check.value) {
        throw new Error(`Missing environment variable: ${check.name}`);
      }
      console.log(`✅ ${check.name}: ${check.value.substring(0, 20)}...`);
    }
    
    console.log('');
  }

  async listMigrations() {
    console.log('📋 Listing available migrations...');
    
    if (!fs.existsSync(CONFIG.MIGRATIONS_PATH)) {
      console.log('⚠️  Migrations directory not found, creating...');
      fs.mkdirSync(CONFIG.MIGRATIONS_PATH, { recursive: true });
      return;
    }
    
    const files = fs.readdirSync(CONFIG.MIGRATIONS_PATH)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    if (files.length === 0) {
      console.log('⚠️  No migration files found');
      return;
    }
    
    console.log(`Found ${files.length} migration files:`);
    files.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file}`);
      this.results.migrations.push({
        name: file,
        status: 'found',
        size: fs.statSync(`${CONFIG.MIGRATIONS_PATH}/${file}`).size
      });
    });
    
    console.log('');
  }

  async testDatabaseConnection() {
    console.log('🔗 Testing database connection...');
    
    try {
      // Simple connection test via Supabase REST API
      const response = await this.makeSupabaseRequest('/rest/v1/', 'GET');
      
      if (response.statusCode === 200 || response.statusCode === 404) {
        console.log('✅ Database connection successful');
        this.results.verification.connection = 'success';
      } else {
        throw new Error(`Unexpected status code: ${response.statusCode}`);
      }
    } catch (error) {
      console.log('❌ Database connection failed:', error.message);
      this.results.verification.connection = 'failed';
    }
    
    console.log('');
  }

  async runMigrations() {
    console.log('🚀 Running database migrations...');
    
    // Check if Supabase CLI is available
    try {
      const cliVersion = execSync('supabase --version', { encoding: 'utf8', stdio: 'pipe' });
      console.log(`📦 Supabase CLI version: ${cliVersion.trim()}`);
    } catch (error) {
      console.log('⚠️  Supabase CLI not found. Manual migration required.');
      console.log('   To run migrations manually:');
      console.log('   1. Install Supabase CLI: npm install -g supabase');
      console.log('   2. Login: supabase login');
      console.log('   3. Link project: supabase link --project-ref YOUR_PROJECT_REF');
      console.log('   4. Push migrations: supabase db push');
      this.results.verification.migrations = 'manual_required';
      console.log('');
      return;
    }
    
    try {
      // Try to run migrations
      console.log('🔄 Pushing migrations to Supabase...');
      const output = execSync('supabase db push', { encoding: 'utf8' });
      console.log('✅ Migrations completed successfully');
      console.log(`Output: ${output}`);
      this.results.verification.migrations = 'success';
    } catch (error) {
      console.log('❌ Migration failed:', error.message);
      console.log('💡 You may need to run migrations manually in Supabase Dashboard');
      this.results.verification.migrations = 'failed';
    }
    
    console.log('');
  }

  async verifySchema() {
    console.log('🔍 Verifying database schema...');
    
    const expectedTables = [
      'profiles',
      'assessments',
      'practices',
      'goals',
      'progress',
      'ai_interactions',
      'learning_paths',
      'notifications',
      'user_onboarding',
      'user_preferences',
      'subscriptions',
      'payments',
      'daily_practices',
      'learning_modules'
    ];
    
    // This is a basic check - in production you'd want to query the actual schema
    console.log(`Expected tables: ${expectedTables.join(', ')}`);
    console.log('⚠️  Schema verification requires direct database access');
    console.log('   To verify manually:');
    console.log('   1. Open Supabase Dashboard');
    console.log('   2. Go to Table Editor');
    console.log('   3. Verify all expected tables exist');
    
    this.results.verification.schema = 'manual_verification_required';
    console.log('');
  }

  async testRLSPolicies() {
    console.log('🛡️  Testing Row Level Security policies...');
    
    // Basic RLS policy test
    console.log('⚠️  RLS policy testing requires authenticated requests');
    console.log('   To test manually:');
    console.log('   1. Create a test user account');
    console.log('   2. Try accessing protected resources');
    console.log('   3. Verify proper access control');
    
    this.results.verification.rls = 'manual_testing_required';
    console.log('');
  }

  async makeSupabaseRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, CONFIG.SUPABASE_URL);
      
      const options = {
        method,
        headers: {
          'apikey': CONFIG.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      };
      
      const req = https.request(url, options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            data: responseData
          });
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  generateSummary() {
    const checks = Object.values(this.results.verification);
    const successCount = checks.filter(c => c === 'success').length;
    const totalChecks = checks.length;
    
    console.log('📊 Database Setup Summary:');
    console.log('══════════════════════════════════');
    console.log(`✅ Successful checks: ${successCount}/${totalChecks}`);
    console.log(`📋 Migrations found: ${this.results.migrations.length}`);
    
    if (successCount === totalChecks) {
      this.results.overall = 'success';
      console.log('\n🎉 Database setup completed successfully!');
    } else {
      this.results.overall = 'partial';
      console.log('\n⚠️  Database setup completed with some manual steps required.');
    }
    
    console.log(`⏰ Timestamp: ${this.results.timestamp}`);
  }

  saveResults() {
    try {
      fs.writeFileSync(CONFIG.LOG_FILE, JSON.stringify(this.results, null, 2));
      console.log(`\n💾 Setup log saved to: ${CONFIG.LOG_FILE}`);
    } catch (error) {
      console.error('Failed to save setup log:', error.message);
    }
  }
}

// Helper function to create a sample environment file
function createSampleEnv() {
  const sampleEnv = `# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# To get these values:
# 1. Go to https://supabase.com/dashboard
# 2. Select your project
# 3. Go to Settings > API
# 4. Copy URL and anon key
`;

  if (!fs.existsSync('.env.example')) {
    fs.writeFileSync('.env.example', sampleEnv);
    console.log('📝 Created .env.example file');
  }
}

// Run setup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Check if environment variables are set
  if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
    console.log('⚠️  Missing Supabase environment variables');
    console.log('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
    createSampleEnv();
    process.exit(1);
  }
  
  const setup = new DatabaseSetup();
  setup.runSetup()
    .then((results) => {
      process.exit(results.overall === 'success' ? 0 : 1);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

export default DatabaseSetup;
