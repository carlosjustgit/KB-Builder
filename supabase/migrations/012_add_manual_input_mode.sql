-- Add manual input mode support to kb_sessions table
-- Migration: 012_add_manual_input_mode.sql

-- Add input_mode column to track how the session was created
ALTER TABLE kb_sessions 
ADD COLUMN IF NOT EXISTS input_mode TEXT CHECK (input_mode IN ('url', 'manual')) DEFAULT 'url';

-- Add manual_input_data column to store manual input details
ALTER TABLE kb_sessions 
ADD COLUMN IF NOT EXISTS manual_input_data JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN kb_sessions.input_mode IS 'How the session was created: url (website URL) or manual (manual input)';
COMMENT ON COLUMN kb_sessions.manual_input_data IS 'Structured manual input data: {company_description, competitors, services, additional_info}';

-- Create index for faster queries by input_mode
CREATE INDEX IF NOT EXISTS idx_kb_sessions_input_mode ON kb_sessions(input_mode);

-- Update existing sessions to have 'url' mode
UPDATE kb_sessions SET input_mode = 'url' WHERE input_mode IS NULL;

