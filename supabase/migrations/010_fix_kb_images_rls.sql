-- Fix RLS policies for kb_images table to allow anonymous users
-- This migration allows anonymous users to upload images in development

-- =====================================================
-- DROP EXISTING POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view images from their sessions" ON kb_images;
DROP POLICY IF EXISTS "Users can insert images for their sessions" ON kb_images;
DROP POLICY IF EXISTS "Users can update images from their sessions" ON kb_images;
DROP POLICY IF EXISTS "Users can delete images from their sessions" ON kb_images;

-- =====================================================
-- CREATE NEW POLICIES FOR ANONYMOUS USERS
-- =====================================================

-- Policy: Allow anonymous users to view all images
CREATE POLICY "Anonymous users can view all images"
  ON kb_images FOR SELECT
  USING (true);

-- Policy: Allow anonymous users to insert images
CREATE POLICY "Anonymous users can insert images"
  ON kb_images FOR INSERT
  WITH CHECK (true);

-- Policy: Allow anonymous users to update images
CREATE POLICY "Anonymous users can update images"
  ON kb_images FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy: Allow anonymous users to delete images
CREATE POLICY "Anonymous users can delete images"
  ON kb_images FOR DELETE
  USING (true);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "Anonymous users can view all images" ON kb_images IS 
'Allows anonymous users to view all images - for development';

COMMENT ON POLICY "Anonymous users can insert images" ON kb_images IS 
'Allows anonymous users to insert images - for development';

COMMENT ON POLICY "Anonymous users can update images" ON kb_images IS 
'Allows anonymous users to update images - for development';

COMMENT ON POLICY "Anonymous users can delete images" ON kb_images IS 
'Allows anonymous users to delete images - for development';

