-- Add updated_at column to kb_visual_guides table
-- This column was missing from the initial table creation

-- Add the updated_at column
ALTER TABLE kb_visual_guides 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create trigger to auto-update updated_at (reusing the existing function)
CREATE TRIGGER update_kb_visual_guides_updated_at
  BEFORE UPDATE ON kb_visual_guides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update existing rows to have updated_at = created_at
UPDATE kb_visual_guides 
SET updated_at = created_at 
WHERE updated_at IS NULL;

