import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../server/services/supabase/client.js';

/**
 * GET /api/chat/:sessionId - Fetch chat history for a session
 * DELETE /api/chat/:sessionId - Clear all chat messages for a session
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

  const { sessionId } = req.query;

  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'Invalid session ID' });
  }

  try {
    if (req.method === 'GET') {
      // Fetch chat history
      const { data, error } = await supabase
        .from('kb_chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching chat history:', error);
        return res.status(500).json({ message: 'Failed to fetch chat history', error });
      }

      return res.json(data?.map(msg => ({
        ...msg,
        timestamp: msg.created_at
      })) || []);

    } else if (req.method === 'DELETE') {
      // Clear chat messages
      const { error } = await supabase
        .from('kb_chat_messages')
        .delete()
        .eq('session_id', sessionId);

      if (error) {
        console.error('Error clearing chat messages:', error);
        return res.status(500).json({ message: 'Failed to clear chat messages', error });
      }

      return res.json({ message: 'Chat messages cleared successfully' });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('[Chat History] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

