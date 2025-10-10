import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { generateTestImages } from '../../server/services/openai/vision.js';
import { supabase } from '../../server/services/supabase/client.js';

// Validation schema
const TestImageSchema = z.object({
  base_prompt: z.string(),
  negative_prompt: z.string().optional(),
  count: z.number().min(1).max(4).optional(),
  session_id: z.string().uuid(),
});

/**
 * POST /api/vision/test-image
 * Generates test images based on visual brand guidelines
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
    const result = TestImageSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: result.error.errors,
      });
    }

    const { base_prompt, negative_prompt, count = 1, session_id } = result.data;

    console.log('🎨 [Vision] Generating test images:', {
      prompt: base_prompt,
      count,
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

    // Generate test images
    console.log('🖼️ [Vision] Calling OpenAI to generate images...');
    const generatedImages = await generateTestImages(
      base_prompt,
      negative_prompt,
      count
    );

    console.log('✅ [Vision] Images generated successfully');
    // In production, you would:
    // 1. Download the generated images
    // 2. Upload them to Supabase Storage
    // 3. Create kb_images records with role='generated'

    // For now, return the URLs directly
    return res.json({
      images: generatedImages,
    });

  } catch (error) {
    console.error('❌ [Vision] Test image error:', error);

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
}

