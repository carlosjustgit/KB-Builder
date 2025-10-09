-- Create kb_chat_messages table for conversational AI
CREATE TABLE IF NOT EXISTS kb_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES kb_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  context_step TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_kb_chat_messages_session_id ON kb_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_kb_chat_messages_created_at ON kb_chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_kb_chat_messages_context_step ON kb_chat_messages(context_step);

-- Add comments
COMMENT ON TABLE kb_chat_messages IS 'Chat messages for conversational AI interactions';
COMMENT ON COLUMN kb_chat_messages.session_id IS 'Reference to the KB session';
COMMENT ON COLUMN kb_chat_messages.role IS 'Message role: user or assistant';
COMMENT ON COLUMN kb_chat_messages.content IS 'The message content';
COMMENT ON COLUMN kb_chat_messages.context_step IS 'The step context when message was sent';
