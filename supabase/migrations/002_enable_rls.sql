-- KB Builder RLS (Row Level Security) Policies
-- Created: Phase 2 - Supabase Audit
-- Description: Enables RLS on all tables and implements owner-only access policies

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================
ALTER TABLE kb_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_visual_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_exports ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES: kb_sessions
-- Owner-only access via auth.uid()
-- =====================================================
CREATE POLICY "Users can view their own sessions"
  ON kb_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own sessions"
  ON kb_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own sessions"
  ON kb_sessions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own sessions"
  ON kb_sessions FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- RLS POLICIES: kb_documents
-- Access via session ownership
-- =====================================================
CREATE POLICY "Users can view documents from their sessions"
  ON kb_documents FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM kb_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create documents in their sessions"
  ON kb_documents FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM kb_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update documents in their sessions"
  ON kb_documents FOR UPDATE
  USING (
    session_id IN (
      SELECT id FROM kb_sessions WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    session_id IN (
      SELECT id FROM kb_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete documents from their sessions"
  ON kb_documents FOR DELETE
  USING (
    session_id IN (
      SELECT id FROM kb_sessions WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- RLS POLICIES: kb_sources
-- Access via session ownership
-- =====================================================
CREATE POLICY "Users can view sources from their sessions"
  ON kb_sources FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM kb_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create sources in their sessions"
  ON kb_sources FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM kb_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete sources from their sessions"
  ON kb_sources FOR DELETE
  USING (
    session_id IN (
      SELECT id FROM kb_sessions WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- RLS POLICIES: kb_images
-- Access via session ownership
-- =====================================================
CREATE POLICY "Users can view images from their sessions"
  ON kb_images FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM kb_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload images to their sessions"
  ON kb_images FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM kb_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update images in their sessions"
  ON kb_images FOR UPDATE
  USING (
    session_id IN (
      SELECT id FROM kb_sessions WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    session_id IN (
      SELECT id FROM kb_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete images from their sessions"
  ON kb_images FOR DELETE
  USING (
    session_id IN (
      SELECT id FROM kb_sessions WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- RLS POLICIES: kb_visual_guides
-- Access via session ownership
-- =====================================================
CREATE POLICY "Users can view visual guides from their sessions"
  ON kb_visual_guides FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM kb_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create visual guides in their sessions"
  ON kb_visual_guides FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM kb_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update visual guides in their sessions"
  ON kb_visual_guides FOR UPDATE
  USING (
    session_id IN (
      SELECT id FROM kb_sessions WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    session_id IN (
      SELECT id FROM kb_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete visual guides from their sessions"
  ON kb_visual_guides FOR DELETE
  USING (
    session_id IN (
      SELECT id FROM kb_sessions WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- RLS POLICIES: kb_exports
-- Access via session ownership
-- =====================================================
CREATE POLICY "Users can view exports from their sessions"
  ON kb_exports FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM kb_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create exports for their sessions"
  ON kb_exports FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM kb_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete exports from their sessions"
  ON kb_exports FOR DELETE
  USING (
    session_id IN (
      SELECT id FROM kb_sessions WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- SECURITY COMMENTS
-- =====================================================
COMMENT ON POLICY "Users can view their own sessions" ON kb_sessions IS 
  'Owner-only access: Users can only view sessions they created';

COMMENT ON POLICY "Users can view documents from their sessions" ON kb_documents IS 
  'Cascading ownership: Users can only view documents from their own sessions';

