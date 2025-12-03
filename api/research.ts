import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { performResearch, performResearchWithContext } from '../server/services/perplexity/client.js';
import { performMultiSourceResearch } from '../server/services/multi-source/research.js';
import { validateResearchQuality } from '../server/services/multi-source/validator.js';
import { supabase } from '../server/services/supabase/client.js';

/**
 * Normalize URL by adding https:// if no protocol is present
 */
function normalizeUrl(url: string): string {
  if (!url) return url;
  
  const trimmed = url.trim();
  
  // If already has protocol, return as-is
  if (trimmed.match(/^https?:\/\//i)) {
    return trimmed;
  }
  
  // Add https:// prefix
  return `https://${trimmed}`;
}

// Validation schema
const ResearchRequestSchema = z.object({
  company_url: z.string().url(),
  locale: z.enum(['en-US', 'en-GB', 'pt-BR', 'pt-PT']),
  step: z.enum(['research', 'brand', 'services', 'market', 'competitors']),
  session_id: z.string().uuid(),
});

/**
 * POST /api/research
 * Performs AI-powered web research using Perplexity
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
    // Normalize URL before validation
    if (req.body.company_url) {
      req.body.company_url = normalizeUrl(req.body.company_url);
      console.log('🔧 Normalized URL:', req.body.company_url);
    }
    
    // Validate request
    const result = ResearchRequestSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: result.error.errors,
      });
    }

    const { company_url, locale, step, session_id } = result.data;

    // Verify session exists and user has access
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

    // Perform research using Multi-Source (Perplexity + OpenAI + Gemini)
    // For competitors, brand, and market steps, use existing research data from step 1
    let researchResult;
    let context: string | undefined;
    
    if (step === 'competitors' || step === 'brand' || step === 'market' || step === 'services') {
      // Get research data from step 1
      const { data: researchDoc, error: researchError } = await supabase
        .from('kb_documents')
        .select('content_md, doc_type')
        .eq('session_id', session_id)
        .eq('doc_type', 'research')
        .single();

      console.log('🔍 Looking for research data for session:', session_id);
      console.log('📊 Research query result:', { researchDoc, researchError });

      if (researchDoc && !researchError) {
        console.log(`🔍 Using research context for ${step} analysis`);
        console.log('📄 Research data length:', researchDoc.content_md.length);
        context = researchDoc.content_md;
      } else {
        console.log('⚠️ No research data found, trying to find any document from this session');
        
        // Fallback: try to find any document from this session
        const { data: anyDoc, error: anyDocError } = await supabase
          .from('kb_documents')
          .select('content_md, doc_type')
          .eq('session_id', session_id)
          .order('created_at', { ascending: true })
          .limit(1)
          .single();

        if (anyDoc && !anyDocError) {
          console.log('🔍 Found fallback document:', anyDoc.doc_type);
          console.log('📄 Fallback data length:', anyDoc.content_md.length);
          context = anyDoc.content_md;
        }
      }
    }

    // Use multi-source research for better accuracy
    console.log('🔍 [Research API] Using multi-source research...');
    const multiSourceResult = await performMultiSourceResearch(company_url, locale, step, context);
    
    // Validate research quality
    console.log('✅ [Research API] Validating research quality...');
    const validation = await validateResearchQuality(
      multiSourceResult.content_md,
      multiSourceResult.sources,
      company_url
    );
    
    console.log(`📊 [Research API] Quality Score: ${validation.qualityScore}/10`);
    console.log(`📊 [Research API] Providers used: ${multiSourceResult.providers_used.join(', ')}`);
    console.log(`📊 [Research API] Confidence: ${multiSourceResult.confidence_score}`);
    
    // Add quality metadata to content if score is low
    let finalContent = multiSourceResult.content_md;
    if (validation.qualityScore < 7) {
      finalContent = `> ⚠️ **Quality Notice**: This content scored ${validation.qualityScore}/10. Please review carefully.\n\n` + finalContent;
    }
    
    researchResult = {
      content_md: finalContent,
      sources: multiSourceResult.sources,
    };

    // Save document to database
    console.log(`💾 Saving ${step} document to database...`);
    const { data: existingDoc } = await supabase
      .from('kb_documents')
      .select('id')
      .eq('session_id', session_id)
      .eq('doc_type', step)
      .single();

    if (existingDoc) {
      // Update existing document
      console.log(`📝 Updating existing ${step} document`);
      await supabase
        .from('kb_documents')
        .update({
          content_md: researchResult.content_md,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingDoc.id);
    } else {
      // Create new document
      console.log(`✨ Creating new ${step} document`);
      await supabase
        .from('kb_documents')
        .insert({
          session_id,
          doc_type: step,
          content_md: researchResult.content_md,
          status: 'draft',
        });
    }

    // Save sources to database
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
      content_md: researchResult.content_md,
      sources: researchResult.sources,
    });

  } catch (error) {
    console.error('[Research] Error:', error);

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

