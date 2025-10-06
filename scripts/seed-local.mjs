#!/usr/bin/env node

/**
 * Seed Script for KB Builder Local Development
 * 
 * This script creates sample data for local testing.
 * DO NOT use in production.
 * 
 * Usage:
 *   node scripts/seed-local.mjs
 * 
 * Requirements:
 *   - .env and .env.local files configured
 *   - Supabase migrations already run
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env files');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS for seeding)
const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('🌱 Starting KB Builder seed script...\n');

  try {
    // For local testing, we'll use a test user ID
    // In production, this would come from auth.uid()
    const testUserId = '00000000-0000-0000-0000-000000000001';

    console.log('📝 Creating test session...');
    const { data: session, error: sessionError } = await supabase
      .from('kb_sessions')
      .insert({
        user_id: testUserId,
        language: 'en-US',
        step: 'research',
      })
      .select()
      .single();

    if (sessionError) {
      console.error('❌ Failed to create session:', sessionError.message);
      throw sessionError;
    }

    console.log(`✅ Session created: ${session.id}\n`);

    // Create sample brand document
    console.log('📄 Creating sample brand document...');
    const { error: docError } = await supabase
      .from('kb_documents')
      .insert({
        session_id: session.id,
        doc_type: 'brand',
        title: 'Brand Overview',
        content_md: `# Sample Company Brand

**Mission:** To revolutionize knowledge management with AI-powered tools.

**Target Audience:** Small to medium businesses, marketing teams, content creators.

**Positioning:** The easiest way to build comprehensive brand documentation.

## Key Differentiators

1. **AI-Powered Research** - Automated web research using Perplexity
2. **Visual Analysis** - Brand guideline generation from images
3. **Multilingual Support** - 4 locales out of the box
`,
        status: 'approved',
      });

    if (docError) {
      console.error('❌ Failed to create document:', docError.message);
      throw docError;
    }

    console.log('✅ Brand document created\n');

    // Create sample sources
    console.log('🔗 Creating sample sources...');
    const { error: sourcesError } = await supabase
      .from('kb_sources')
      .insert([
        {
          session_id: session.id,
          url: 'https://example.com/about',
          provider: 'perplexity',
          snippet: 'Sample company information from about page...',
        },
        {
          session_id: session.id,
          url: 'https://example.com/blog/vision',
          provider: 'perplexity',
          snippet: 'Company vision and mission statement...',
        },
      ]);

    if (sourcesError) {
      console.error('❌ Failed to create sources:', sourcesError.message);
      throw sourcesError;
    }

    console.log('✅ Sources created\n');

    // Summary
    console.log('═'.repeat(50));
    console.log('🎉 Seed completed successfully!\n');
    console.log('Test Data Created:');
    console.log(`  • Session ID: ${session.id}`);
    console.log(`  • User ID: ${testUserId}`);
    console.log(`  • Language: en-US`);
    console.log(`  • Documents: 1 (brand)`);
    console.log(`  • Sources: 2`);
    console.log('═'.repeat(50));

    console.log('\n💡 Next steps:');
    console.log('  1. Start the dev server: pnpm dev');
    console.log('  2. Visit http://localhost:5173');
    console.log(`  3. Use session ID in your app: ${session.id}\n`);

  } catch (error) {
    console.error('\n❌ Seed failed:', error.message);
    process.exit(1);
  }
}

// Run seed
seed();

