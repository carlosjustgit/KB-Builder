import { createClient } from '@supabase/supabase-js';

// Validate environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

// Create Supabase client (client-side with anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Client-side helper functions
 * These use the anon key and respect RLS policies
 */

export const auth = {
  /**
   * For now, we'll use anonymous sessions
   * Later this can be extended to support full auth
   */
  async signInAnonymously() {
    return await supabase.auth.signInAnonymously();
  },

  async getUser() {
    const { data } = await supabase.auth.getUser();
    return data.user;
  },

  async signOut() {
    return await supabase.auth.signOut();
  },
};

/**
 * Storage helpers for client-side uploads
 */

export const storage = {
  async uploadImage(
    sessionId: string,
    file: File
  ): Promise<{ path: string; url: string } | null> {
    try {
      const timestamp = Date.now();
      const path = `images/user/${sessionId}/${timestamp}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('kb-builder')
        .upload(path, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      // Get signed URL
      const { data: urlData } = await supabase.storage
        .from('kb-builder')
        .createSignedUrl(path, 3600); // 1 hour

      if (!urlData) {
        return null;
      }

      return {
        path,
        url: urlData.signedUrl,
      };
    } catch (error) {
      console.error('Storage upload failed:', error);
      return null;
    }
  },

  async getSignedUrl(path: string, expiresIn = 3600) {
    const { data } = await supabase.storage
      .from('kb-builder')
      .createSignedUrl(path, expiresIn);
    
    return data?.signedUrl;
  },
};

/**
 * Compute SHA256 hash of a file (client-side)
 * Used for image deduplication
 */

export async function computeFileSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

