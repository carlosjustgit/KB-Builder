#!/usr/bin/env node

/**
 * Quick test to verify Supabase connection and tables
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '..', '.env') });
config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Testing Supabase connection...\n');

try {
  // Test if tables exist by trying to query them
  const { data, error } = await supabase.from('kb_sessions').select('count');
  
  if (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure you ran both migration files in Supabase SQL Editor');
  } else {
    console.log('✅ Connection successful!');
    console.log('✅ Tables are created and accessible\n');
  }
} catch (err) {
  console.error('❌ Connection failed:', err.message);
}

