import { Router } from 'express';
import { z } from 'zod';
import type { Request, Response } from 'express';
import fetch from 'node-fetch';
import { supabase } from '../services/supabase/client.js';
import crypto from 'crypto';

const router = Router();

// Validation schema
const ImportImageSchema = z.object({
  url: z.string().url(),
  session_id: z.string().uuid(),
});

/**
 * POST /api/images/import-url
 * Import an image from a URL (server-side to avoid CORS issues)
 */
router.post('/import-url', async (req: Request, res: Response) => {
  try {
    const result = ImportImageSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: result.error.errors,
      });
    }

    const { url, session_id } = result.data;

    console.log('🌐 Importing image from URL:', url);

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

    // Fetch the image from the URL
    console.log('📥 Fetching image...');
    const response = await fetch(url);
    
    if (!response.ok) {
      return res.status(400).json({
        error: 'Failed to fetch image',
        message: `HTTP ${response.status}: ${response.statusText}`,
      });
    }

    // Get the image buffer
    const buffer = await response.buffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    console.log('✅ Image fetched:', contentType, buffer.length, 'bytes');

    // Validate it's an image
    if (!contentType.startsWith('image/')) {
      return res.status(400).json({
        error: 'URL does not point to an image',
        message: `Content-Type: ${contentType}`,
      });
    }

    // Generate filename based on URL
    const urlObj = new URL(url);
    const originalFilename = urlObj.pathname.split('/').pop() || 'imported.jpg';
    const timestamp = Date.now();
    const fileName = `imported-${timestamp}-${originalFilename}`;
    const filePath = `images/user/${session_id}/${fileName}`;

    console.log('📤 Uploading to Supabase storage:', filePath);

    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('kb-builder')
      .upload(filePath, buffer, {
        contentType,
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      return res.status(500).json({
        error: 'Failed to upload image',
        message: uploadError.message,
      });
    }

    console.log('✅ Image uploaded to storage');

    // Compute SHA256 hash
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

    // Create image record in database
    const { data: image, error: dbError } = await supabase
      .from('kb_images')
      .insert({
        session_id,
        file_path: filePath,
        mime: contentType,
        size_bytes: buffer.length,
        sha256,
        role: 'user',
        status: 'uploaded',
      })
      .select()
      .single();

    if (dbError) {
      console.error('❌ Database error:', dbError);
      return res.status(500).json({
        error: 'Failed to save image record',
        message: dbError.message,
      });
    }

    console.log('✅ Image record created:', image.id);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('kb-builder')
      .getPublicUrl(filePath);

    return res.json({
      image,
      signedUrl: urlData?.publicUrl || '',
    });

  } catch (error) {
    console.error('[Images] Import URL error:', error);

    if (error instanceof Error) {
      return res.status(500).json({
        error: 'Failed to import image',
        message: error.message,
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
    });
  }
});

export default router;

