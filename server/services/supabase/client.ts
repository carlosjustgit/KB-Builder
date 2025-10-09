import { createClient } from '@supabase/supabase-js';

// Validate environment variables
// Server should use non-VITE prefixed env vars or fallback to VITE_ for compatibility
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Server environment check:');
console.log('  - SUPABASE_URL:', process.env.SUPABASE_URL ? '✓' : '✗');
console.log('  - VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✓' : '✗');
console.log('  - SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
console.log('  - Final supabaseUrl:', supabaseUrl ? '✓' : '✗');

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL or VITE_SUPABASE_URL environment variable');
}

if (!supabaseServiceKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

// Create Supabase client with service role key (bypasses RLS for server operations)
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Database helper functions
 */

export const db = {
  // Sessions
  async createSession(data: {
    user_id: string;
    language: string;
    step: string;
    profile_id?: string;
  }) {
    return await supabase
      .from('kb_sessions')
      .insert(data)
      .select()
      .single();
  },

  async getSession(id: string) {
    return await supabase
      .from('kb_sessions')
      .select('*')
      .eq('id', id)
      .single();
  },

  async updateSession(id: string, data: Partial<{
    language: string;
    step: string;
  }>) {
    return await supabase
      .from('kb_sessions')
      .update(data)
      .eq('id', id)
      .select()
      .single();
  },

  // Documents
  async createDocument(data: {
    session_id: string;
    doc_type: string;
    title?: string;
    content_md?: string;
    content_json?: Record<string, unknown>;
    status?: string;
  }) {
    return await supabase
      .from('kb_documents')
      .insert(data)
      .select()
      .single();
  },

  async getDocuments(session_id: string) {
    return await supabase
      .from('kb_documents')
      .select('*')
      .eq('session_id', session_id);
  },

  async getDocumentByType(session_id: string, doc_type: string) {
    return await supabase
      .from('kb_documents')
      .select('*')
      .eq('session_id', session_id)
      .eq('doc_type', doc_type)
      .single();
  },

  async updateDocument(id: string, data: Partial<{
    title: string;
    content_md: string;
    content_json: Record<string, unknown>;
    status: string;
  }>) {
    return await supabase
      .from('kb_documents')
      .update(data)
      .eq('id', id)
      .select()
      .single();
  },

  // Sources
  async createSources(sources: Array<{
    session_id: string;
    url: string;
    provider?: string;
    snippet?: string;
  }>) {
    return await supabase
      .from('kb_sources')
      .insert(sources)
      .select();
  },

  async getSources(session_id: string) {
    return await supabase
      .from('kb_sources')
      .select('*')
      .eq('session_id', session_id);
  },

  // Images
  async createImage(data: {
    session_id: string;
    file_path: string;
    mime: string;
    size_bytes?: number;
    sha256?: string;
    role: string;
    status?: string;
  }) {
    return await supabase
      .from('kb_images')
      .insert(data)
      .select()
      .single();
  },

  async getImages(session_id: string, role?: string) {
    let query = supabase
      .from('kb_images')
      .select('*')
      .eq('session_id', session_id);
    
    if (role) {
      query = query.eq('role', role);
    }
    
    return await query;
  },

  async getImageBySha256(session_id: string, sha256: string) {
    return await supabase
      .from('kb_images')
      .select('*')
      .eq('session_id', session_id)
      .eq('sha256', sha256)
      .single();
  },

  async updateImage(id: string, data: Partial<{
    status: string;
  }>) {
    return await supabase
      .from('kb_images')
      .update(data)
      .eq('id', id)
      .select()
      .single();
  },

  // Visual Guides
  async createVisualGuide(data: {
    session_id: string;
    rules_json: Record<string, unknown>;
    derived_palettes_json?: Record<string, unknown>;
  }) {
    return await supabase
      .from('kb_visual_guides')
      .insert(data)
      .select()
      .single();
  },

  async getVisualGuide(session_id: string) {
    return await supabase
      .from('kb_visual_guides')
      .select('*')
      .eq('session_id', session_id)
      .single();
  },

  // Exports
  async createExport(data: {
    session_id: string;
    file_type: string;
    storage_path: string;
  }) {
    return await supabase
      .from('kb_exports')
      .insert(data)
      .select()
      .single();
  },

  async getExports(session_id: string) {
    return await supabase
      .from('kb_exports')
      .select('*')
      .eq('session_id', session_id);
  },
};

/**
 * Storage helper functions
 */

export const storage = {
  async uploadFile(
    bucket: string,
    path: string,
    file: Buffer | Blob,
    options?: { contentType?: string; upsert?: boolean }
  ) {
    return await supabase.storage
      .from(bucket)
      .upload(path, file, options);
  },

  async getSignedUrl(bucket: string, path: string, expiresIn = 3600) {
    return await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);
  },

  async deleteFile(bucket: string, path: string) {
    return await supabase.storage
      .from(bucket)
      .remove([path]);
  },
};

