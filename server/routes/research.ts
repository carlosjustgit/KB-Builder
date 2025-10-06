import { Router } from 'express';
import { z } from 'zod';
import type { Request, Response } from 'express';

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

    // TODO: Implement Perplexity research logic
    // const { company_url, locale, step, session_id } = result.data;
    
    return res.status(501).json({
      error: 'Not implemented yet',
      message: 'Research endpoint will be implemented in Phase 7',
    });
  } catch (error) {
    console.error('[Research] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
});

export default router;

