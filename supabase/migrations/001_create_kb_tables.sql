-- KB Builder Core Tables Migration
-- Created: Phase 2 - Supabase Audit
-- Description: Creates all core tables for the Knowledge Base Builder application

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: kb_sessions
-- Purpose: Track wizard sessions and progress
-- =====================================================
CREATE TABLE IF NOT EXISTS kb_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID,
  language TEXT NOT NULL CHECK (language IN ('en-US', 'en-GB', 'pt-BR', 'pt-PT')),
  step TEXT NOT NULL CHECK (step IN ('welcome', 'research', 'brand', 'services', 'market', 'competitors', 'visual', 'export')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for session lookups
CREATE INDEX IF NOT EXISTS idx_kb_sessions_user_id ON kb_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_kb_sessions_step ON kb_sessions(step);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_kb_sessions_updated_at
  BEFORE UPDATE ON kb_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABLE: kb_documents
-- Purpose: Store all KB content (brand, services, market, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS kb_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES kb_sessions(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('brand', 'services', 'market', 'competitors', 'tone', 'visual')),
  title TEXT,
  content_md TEXT,
  content_json JSONB,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for document lookups
CREATE INDEX IF NOT EXISTS idx_kb_documents_session_id ON kb_documents(session_id);
CREATE INDEX IF NOT EXISTS idx_kb_documents_session_doc_type ON kb_documents(session_id, doc_type);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_kb_documents_updated_at
  BEFORE UPDATE ON kb_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABLE: kb_sources
-- Purpose: Store citation sources from research
-- =====================================================
CREATE TABLE IF NOT EXISTS kb_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES kb_sessions(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  provider TEXT CHECK (provider IN ('perplexity', 'openai', 'manual')),
  snippet TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for source lookups
CREATE INDEX IF NOT EXISTS idx_kb_sources_session_id ON kb_sources(session_id);

-- =====================================================
-- TABLE: kb_images
-- Purpose: Track uploaded and generated images
-- =====================================================
CREATE TABLE IF NOT EXISTS kb_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES kb_sessions(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  mime TEXT NOT NULL,
  size_bytes INTEGER,
  sha256 TEXT,
  role TEXT NOT NULL CHECK (role IN ('user', 'generated')),
  status TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'analysed', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for image lookups
CREATE INDEX IF NOT EXISTS idx_kb_images_session_id ON kb_images(session_id);
CREATE INDEX IF NOT EXISTS idx_kb_images_session_role_status ON kb_images(session_id, role, status);
CREATE INDEX IF NOT EXISTS idx_kb_images_sha256 ON kb_images(sha256);

-- =====================================================
-- TABLE: kb_visual_guides
-- Purpose: Store visual brand guideline data
-- =====================================================
CREATE TABLE IF NOT EXISTS kb_visual_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES kb_sessions(id) ON DELETE CASCADE,
  rules_json JSONB NOT NULL,
  derived_palettes_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for visual guide lookups
CREATE INDEX IF NOT EXISTS idx_kb_visual_guides_session_id ON kb_visual_guides(session_id);

-- =====================================================
-- TABLE: kb_exports
-- Purpose: Track export history (JSON and ZIP)
-- =====================================================
CREATE TABLE IF NOT EXISTS kb_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES kb_sessions(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL CHECK (file_type IN ('json', 'zip')),
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for export lookups
CREATE INDEX IF NOT EXISTS idx_kb_exports_session_id ON kb_exports(session_id);
CREATE INDEX IF NOT EXISTS idx_kb_exports_session_file_type ON kb_exports(session_id, file_type);

-- =====================================================
-- COMMENTS (for documentation)
-- =====================================================
COMMENT ON TABLE kb_sessions IS 'Tracks user wizard sessions and current progress';
COMMENT ON TABLE kb_documents IS 'Stores all KB content in both markdown and structured JSON formats';
COMMENT ON TABLE kb_sources IS 'Stores citation sources from AI research';
COMMENT ON TABLE kb_images IS 'Registry of uploaded and AI-generated images';
COMMENT ON TABLE kb_visual_guides IS 'Visual brand guidelines derived from image analysis';
COMMENT ON TABLE kb_exports IS 'History of JSON and ZIP exports';

