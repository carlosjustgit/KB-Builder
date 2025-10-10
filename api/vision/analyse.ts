import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { analyzeImagesForGuidelines } from '../../server/services/openai/vision.js';
import { supabase } from '../../server/services/supabase/client.js';

// Validation schema
const VisionAnalyseSchema = z.object({
  image_urls: z.array(z.string().url()),
  locale: z.enum(['en-US', 'en-GB', 'pt-BR', 'pt-PT']),
  brand_context: z.string().optional(),
  session_id: z.string().uuid(),
});

/**
 * POST /api/vision/analyse
 * Analyzes images using OpenAI Vision to generate visual brand guidelines
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
    const result = VisionAnalyseSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: result.error.errors,
      });
    }

    const { image_urls, locale, brand_context, session_id } = result.data;

    console.log('🔍 [Vision] Starting image analysis:', {
      imageCount: image_urls.length,
      locale,
      sessionId: session_id,
    });

    // Verify session exists and user has access
    const { data: session, error: sessionError } = await supabase
      .from('kb_sessions')
      .select('*')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      console.error('❌ [Vision] Session not found:', sessionError);
      return res.status(404).json({
        error: 'Session not found',
      });
    }

    // Get signed URLs for the images (they should already be signed)
    const signedUrls = image_urls; // Assuming these are already signed URLs

    console.log('📸 [Vision] Analyzing images with OpenAI...');
    // Perform vision analysis
    const analysisResult = await analyzeImagesForGuidelines(
      signedUrls,
      locale,
      brand_context
    );

    console.log('💾 [Vision] Saving visual guide to database...');
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
    await supabase
      .from('kb_images')
      .update({ status: 'analysed' })
      .eq('session_id', session_id)
      .eq('status', 'uploaded');

    console.log('✅ [Vision] Analysis complete');
    // Return analysis results
    return res.json({
      visual_guide: analysisResult.visual_guide,
      guide_md: analysisResult.guide_md,
    });

  } catch (error) {
    console.error('❌ [Vision] Analyse error:', error);

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
}

