import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { supabase } from '../../server/services/supabase/client.js';

// Validation schema for content updates
const ContentUpdateSchema = z.object({
  session_id: z.string().uuid(),
  step: z.string(),
  updated_content: z.string().min(1),
  reason: z.string().optional(),
});

/**
 * POST /api/chat/update-content
 * Update step content from chat interactions
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
    const result = ContentUpdateSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: result.error.errors,
      });
    }

    const { session_id, step, updated_content, reason } = result.data;

    // Update the document in the database
    const { error } = await supabase
      .from('kb_documents')
      .update({
        content_md: updated_content,
        updated_at: new Date().toISOString(),
      })
      .eq('session_id', session_id)
      .eq('doc_type', step);

    if (error) {
      console.error('Error updating content:', error);
      return res.status(500).json({ 
        error: 'Failed to update content',
        details: error.message 
      });
    }

    // Log the update for debugging
    console.log(`📝 Content updated for session ${session_id}, step ${step}`);
    if (reason) {
      console.log(`📝 Reason: ${reason}`);
    }

    return res.json({ 
      success: true, 
      message: 'Content updated successfully',
      step,
      reason 
    });

  } catch (error) {
    console.error('[Content Update] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

