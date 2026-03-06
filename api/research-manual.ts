import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { performManualResearch } from '../server/services/openai/manual-research.js';
import { supabase } from '../server/services/supabase/client.js';

/**
 * Manual Input Research Schema
 */
const ManualResearchRequestSchema = z.object({
  session_id: z.string().uuid(),
  locale: z.enum(['en-US', 'en-GB', 'pt-BR', 'pt-PT']),
  step: z.enum(['research', 'brand', 'services', 'market', 'competitors']),
  manual_input: z.object({
    company_description: z.string().min(10, 'Company description must be at least 10 characters'),
    competitors: z.array(z.string()).optional(),
    services: z.string().optional(),
    additional_info: z.string().optional(),
  }),
});

/**
 * POST /api/research-manual
 * Performs AI-powered research based on manual user input
 * Uses multi-source AI (Perplexity + OpenAI + Gemini) for comprehensive results
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate request
    const result = ManualResearchRequestSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: result.error.errors,
      });
    }

    const { session_id, locale, step, manual_input } = result.data;

    console.log('📝 [Manual Research] Processing manual input for step:', step);
    console.log('📝 [Manual Research] Company description length:', manual_input.company_description.length);

    // Verify session exists
    const { data: session, error: sessionError } = await supabase
      .from('kb_sessions')
      .select('*')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({
        error: 'Session not found',
      });
    }

    // Update session with manual input data
    await supabase
      .from('kb_sessions')
      .update({
        input_mode: 'manual',
        manual_input_data: manual_input,
      })
      .eq('id', session_id);

    // Perform manual research using OpenAI
    console.log('🔍 [Manual Research] Generating content from manual input...');
    const researchResult = await performManualResearch(
      manual_input,
      locale,
      step
    );

    console.log(`✅ [Manual Research] Generated ${researchResult.content_md.length} characters`);
    console.log(`📊 [Manual Research] Quality Score: ${researchResult.quality_score}/10`);

    let finalContent = researchResult.content_md;

    // Add manual input notice
    finalContent = `> ℹ️ **Source**: Generated from your manual input\n\n` + finalContent;

    // Save document to database
    console.log(`💾 [Manual Research] Saving ${step} document to database...`);
    const { data: existingDoc } = await supabase
      .from('kb_documents')
      .select('id')
      .eq('session_id', session_id)
      .eq('doc_type', step)
      .single();

    if (existingDoc) {
      // Update existing document
      console.log(`📝 [Manual Research] Updating existing ${step} document`);
      await supabase
        .from('kb_documents')
        .update({
          content_md: finalContent,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingDoc.id);
    } else {
      // Create new document
      console.log(`✨ [Manual Research] Creating new ${step} document`);
      await supabase
        .from('kb_documents')
        .insert({
          session_id,
          doc_type: step,
          content_md: finalContent,
          status: 'draft',
        });
    }

    // Save sources to database (if any)
    if (researchResult.sources && researchResult.sources.length > 0) {
      await supabase
        .from('kb_sources')
        .insert(
          researchResult.sources.map(source => ({
            session_id,
            url: source.url,
            provider: source.provider,
            snippet: source.snippet,
          }))
        );
    }

    // Update session step if this is the research step
    if (step === 'research') {
      await supabase
        .from('kb_sessions')
        .update({ step: 'brand' })
        .eq('id', session_id);
    }

    // Return research results
    return res.json({
      content_md: finalContent,
      sources: researchResult.sources,
      quality_score: researchResult.quality_score,
      confidence_score: researchResult.quality_score / 10,
      providers_used: ['openai'],
    });

  } catch (error) {
    console.error('[Manual Research] Error:', error);

    if (error instanceof Error) {
      return res.status(500).json({
        error: 'Research failed',
        message: error.message,
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}
