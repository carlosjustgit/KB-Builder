-- Add company_url column to kb_sessions table
ALTER TABLE kb_sessions ADD COLUMN IF NOT EXISTS company_url TEXT;

-- Add comment
COMMENT ON COLUMN kb_sessions.company_url IS 'Company website URL provided during session creation';

