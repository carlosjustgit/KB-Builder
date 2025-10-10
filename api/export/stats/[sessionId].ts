import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../server/services/supabase/client.js';

/**
 * GET /api/export/stats?sessionId=xxx
 * Get export statistics for a session
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessionId = req.query.sessionId as string;

    if (!sessionId) {
      return res.status(400).json({
        error: 'Session ID is required',
      });
    }

    console.log(`📊 [Export] Fetching stats for session ${sessionId}`);

    // Fetch exports
    const { data: exports, error } = await supabase
      .from('kb_exports')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [Export] Failed to fetch exports:', error);
      throw new Error(`Failed to fetch export stats: ${error.message}`);
    }

    // Fetch image count
    const { count: imageCount, error: imageError } = await supabase
      .from('kb_images')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    if (imageError) {
      console.warn('[Export] Failed to fetch image count:', imageError);
    }

    // Fetch source count
    const { count: sourceCount, error: sourceError } = await supabase
      .from('kb_sources')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    if (sourceError) {
      console.warn('[Export] Failed to fetch source count:', sourceError);
    }

    const stats = {
      total_exports: exports?.length || 0,
      json_exports: exports?.filter(e => e.file_type === 'json').length || 0,
      zip_exports: exports?.filter(e => e.file_type === 'zip').length || 0,
      total_images: imageCount || 0,
      total_sources: sourceCount || 0,
      latest_export: exports?.[0] ? {
        file_type: exports[0].file_type,
        created_at: exports[0].created_at,
        storage_path: exports[0].storage_path,
      } : undefined,
    };

    console.log('✅ [Export] Stats fetched successfully');
    return res.json({
      success: true,
      data: stats,
    });

  } catch (error) {
    console.error('❌ [Export] Stats error:', error);

    if (error instanceof Error) {
      return res.status(500).json({
        error: 'Failed to fetch export stats',
        message: error.message,
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}

