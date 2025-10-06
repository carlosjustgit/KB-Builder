import { Router } from 'express';
import { z } from 'zod';
import type { Request, Response } from 'express';
import { performResearch } from '../services/perplexity/client.js';
import { supabase } from '../services/supabase/client.js';

const router = Router();

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
router.post('/', async (req: Request, res: Response) => {
  try {
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

    // Perform research using Perplexity
    const researchResult = await performResearch(company_url, locale, step);

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
});

export default router;

