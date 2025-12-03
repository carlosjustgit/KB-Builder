import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { performMultiSourceResearch } from '../server/services/multi-source/research.js';
import { validateResearchQuality } from '../server/services/multi-source/validator.js';
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

    // Build context from manual input
    const context = buildContextFromManualInput(manual_input, step);
    console.log('📄 [Manual Research] Built context length:', context.length);

    // Use a placeholder URL for manual input mode
    const placeholderUrl = 'https://manual-input.witfy.ai';

    // Perform multi-source research with manual input context
    console.log('🔍 [Manual Research] Starting multi-source research...');
    const researchResult = await performMultiSourceResearch(
      placeholderUrl,
      locale,
      step,
      context
    );

    // Validate research quality
    console.log('✅ [Manual Research] Validating research quality...');
    const validation = await validateResearchQuality(
      researchResult.content_md,
      researchResult.sources,
      placeholderUrl
    );

    console.log(`📊 [Manual Research] Quality Score: ${validation.qualityScore}/10`);
    console.log(`📊 [Manual Research] Providers used: ${researchResult.providers_used.join(', ')}`);
    console.log(`📊 [Manual Research] Confidence: ${researchResult.confidence_score}`);

    // Enhance content with manual input context
    let finalContent = enhanceContentWithManualInput(
      researchResult.content_md,
      manual_input,
      step
    );

    // Add quality notice if needed
    if (validation.qualityScore < 7) {
      finalContent = `> ⚠️ **Quality Notice**: This content scored ${validation.qualityScore}/10. Please review carefully.\n\n` + finalContent;
    }

    // Add manual input notice
    finalContent = `> ℹ️ **Source**: Generated from manual input\n\n` + finalContent;

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
      quality_score: validation.qualityScore,
      confidence_score: researchResult.confidence_score,
      providers_used: researchResult.providers_used,
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

/**
 * Build context from manual input for AI research
 */
function buildContextFromManualInput(
  manualInput: {
    company_description: string;
    competitors?: string[];
    services?: string;
    additional_info?: string;
  },
  step: string
): string {
  let context = `# Company Information (User Provided)\n\n`;
  
  context += `## Company Description\n${manualInput.company_description}\n\n`;

  if (manualInput.competitors && manualInput.competitors.length > 0) {
    context += `## Known Competitors\n`;
    manualInput.competitors.forEach(competitor => {
      context += `- ${competitor}\n`;
    });
    context += `\n`;
  }

  if (manualInput.services) {
    context += `## Services/Products\n${manualInput.services}\n\n`;
  }

  if (manualInput.additional_info) {
    context += `## Additional Information\n${manualInput.additional_info}\n\n`;
  }

  context += `\n---\n\n`;
  context += `Based on the above information provided by the user, please create a comprehensive ${step} document. `;
  context += `Expand on the provided information with industry insights, best practices, and relevant analysis. `;
  context += `Use the user's input as the foundation and build upon it with your knowledge.`;

  return context;
}

/**
 * Enhance generated content with manual input details
 */
function enhanceContentWithManualInput(
  content: string,
  manualInput: {
    company_description: string;
    competitors?: string[];
    services?: string;
    additional_info?: string;
  },
  step: string
): string {
  // Add a section referencing the manual input
  let enhanced = content;

  // For research step, ensure user's description is prominently featured
  if (step === 'research') {
    enhanced = `# Company Overview\n\n${manualInput.company_description}\n\n` + enhanced;
  }

  // For competitors step, ensure user's competitors are included
  if (step === 'competitors' && manualInput.competitors && manualInput.competitors.length > 0) {
    const competitorsList = manualInput.competitors.map(c => `- ${c}`).join('\n');
    enhanced = enhanced.replace(
      /# Competitors/i,
      `# Competitors\n\n## Known Competitors (User Provided)\n${competitorsList}\n\n## Competitive Analysis`
    );
  }

  return enhanced;
}

