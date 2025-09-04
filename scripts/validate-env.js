#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * 
 * This script validates that all required environment variables are present
 * before proceeding with the build process. It's designed to fail fast if
 * critical configuration is missing.
 */

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

console.log('🔍 Validating environment variables...');

// Define required environment variables for production
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

// Define optional environment variables with defaults
const optionalEnvVars = {
  'VITE_APP_NAME': 'Kasama AI',
  'VITE_APP_ENV': 'production',
  'VITE_ENABLE_AI_FEATURES': 'false',
  'VITE_ENABLE_OFFLINE_MODE': 'true',
  'VITE_ENABLE_ANALYTICS': 'false'
};

// Check for missing required variables
const missingRequired = requiredEnvVars.filter(key => !process.env[key]);
const missingOptional = Object.keys(optionalEnvVars).filter(key => !process.env[key]);

// Report status
console.log('\n📋 Environment Variable Status:');
console.log('================================');

// Required variables
requiredEnvVars.forEach(key => {
  const value = process.env[key];
  if (value) {
    console.log(`✅ ${key}: Set (${value.length} chars)`);
  } else {
    console.log(`❌ ${key}: Missing`);
  }
});

// Optional variables
Object.entries(optionalEnvVars).forEach(([key, defaultValue]) => {
  const value = process.env[key];
  if (value) {
    console.log(`ℹ️  ${key}: ${value}`);
  } else {
    console.log(`⚠️  ${key}: Using default (${defaultValue})`);
  }
});

// Validate Supabase URL format if present
if (process.env.VITE_SUPABASE_URL) {
  const url = process.env.VITE_SUPABASE_URL;
  if (!url.startsWith('https://')) {
    console.log('❌ VITE_SUPABASE_URL must start with https://');
    missingRequired.push('VITE_SUPABASE_URL (invalid format)');
  } else if (url.includes('your-project')) {
    console.log('❌ VITE_SUPABASE_URL contains placeholder text');
    missingRequired.push('VITE_SUPABASE_URL (placeholder)');
  }
}

// Validate Supabase key format if present
if (process.env.VITE_SUPABASE_ANON_KEY) {
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (key.includes('your-anon-key')) {
    console.log('❌ VITE_SUPABASE_ANON_KEY contains placeholder text');
    missingRequired.push('VITE_SUPABASE_ANON_KEY (placeholder)');
  }
}

console.log('\n' + '='.repeat(32));

// Final validation
if (missingRequired.length > 0) {
  console.error(`\n❌ Build failed: Missing required environment variables:`);
  missingRequired.forEach(key => console.error(`   - ${key}`));
  console.error(`\nPlease set these environment variables and try again.`);
  console.error(`For local development, copy .env.example to .env and update the values.`);
  process.exit(1);
} else {
  console.log('✅ All required environment variables are present');
  
  if (missingOptional.length > 0) {
    console.log(`\nℹ️  Using defaults for ${missingOptional.length} optional variable(s)`);
  }
  
  console.log('🚀 Ready to build!');
  process.exit(0);
}
