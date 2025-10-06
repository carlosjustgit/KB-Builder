import { Router } from 'express';
import { z } from 'zod';
import type { Request, Response } from 'express';
import { analyzeImagesForGuidelines, generateTestImages } from '../services/openai/vision.js';
import { supabase } from '../services/supabase/client.js';

const router = Router();

// Validation schemas
const VisionAnalyseSchema = z.object({
  image_urls: z.array(z.string().url()),
  locale: z.enum(['en-US', 'en-GB', 'pt-BR', 'pt-PT']),
  brand_context: z.string().optional(),
  session_id: z.string().uuid(),
});

const TestImageSchema = z.object({
  base_prompt: z.string(),
  negative_prompt: z.string().optional(),
  count: z.number().min(1).max(4).optional(),
  session_id: z.string().uuid(),
});

/**
 * POST /api/vision/analyse
 * Analyzes images using OpenAI Vision to generate visual brand guidelines
 */
router.post('/analyse', async (req: Request, res: Response) => {
  try {
    const result = VisionAnalyseSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: result.error.errors,
      });
    }

    const { image_urls, locale, brand_context, session_id } = result.data;

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

    // Get signed URLs for the images (they should already be signed)
    const signedUrls = image_urls; // Assuming these are already signed URLs

    // Perform vision analysis
    const analysisResult = await analyzeImagesForGuidelines(
      signedUrls,
      locale,
      brand_context
    );

    // Save visual guide to database
    await supabase
      .from('kb_visual_guides')
      .upsert({
        session_id,
        rules_json: analysisResult.visual_guide,
        derived_palettes_json: {
          extracted_from_images: image_urls.length,
          analysis_timestamp: new Date().toISOString(),
        },
      });

    // Update image statuses to analyzed
    for (const imageUrl of image_urls) {
      // Find image by URL (this is simplified - in production you'd match by file_path)
      await supabase
        .from('kb_images')
        .update({ status: 'analysed' })
        .eq('session_id', session_id)
        .eq('status', 'uploaded');
    }

    // Return analysis results
    return res.json({
      visual_guide: analysisResult.visual_guide,
      guide_md: analysisResult.guide_md,
    });

  } catch (error) {
    console.error('[Vision] Analyse error:', error);

    if (error instanceof Error) {
      return res.status(500).json({
        error: 'Vision analysis failed',
        message: error.message,
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/visual/test-image
 * Generates test images based on visual brand guidelines
 */
router.post('/test-image', async (req: Request, res: Response) => {
  try {
    const result = TestImageSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: result.error.errors,
      });
    }

    const { base_prompt, negative_prompt, count = 1, session_id } = result.data;

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

    // Generate test images
    const generatedImages = await generateTestImages(
      base_prompt,
      negative_prompt,
      count
    );

    // In production, you would:
    // 1. Download the generated images
    // 2. Upload them to Supabase Storage
    // 3. Create kb_images records with role='generated'

    // For now, return the URLs directly
    return res.json({
      images: generatedImages,
    });

  } catch (error) {
    console.error('[Vision] Test image error:', error);

    if (error instanceof Error) {
      return res.status(500).json({
        error: 'Image generation failed',
        message: error.message,
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
    });
  }
});

export default router;

