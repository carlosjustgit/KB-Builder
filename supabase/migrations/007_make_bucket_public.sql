-- Make kb-builder bucket public for development
-- This bypasses all RLS policies and allows anonymous access

-- Update the bucket to be public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'kb-builder';

-- Ensure the bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('kb-builder', 'kb-builder', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Add comment
COMMENT ON TABLE storage.buckets IS 'KB Builder storage bucket - public for development';
