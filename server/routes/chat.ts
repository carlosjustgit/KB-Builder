import { Router } from 'express';
import { z } from 'zod';
import type { Request, Response } from 'express';
import { supabase } from '../services/supabase/client.js';

const router = Router();

// Validation schema for chat requests
const ChatRequestSchema = z.object({
  session_id: z.string().uuid(),
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1),
  current_step: z.string(),
  company_url: z.string().url().optional(),
  current_content: z.string().optional(),
  user_language: z.string().optional(), // Add user language field
});

// Validation schema for content updates
const ContentUpdateSchema = z.object({
  session_id: z.string().uuid(),
  step: z.string(),
  updated_content: z.string().min(1),
  reason: z.string().optional(),
});

/**
 * POST /api/chat
 * Conversational AI endpoint for user interactions
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    console.log('📨 Chat request received:', {
      body: req.body,
      timestamp: new Date().toISOString()
    });

    // Validate request
    const result = ChatRequestSchema.safeParse(req.body);

    if (!result.success) {
      console.error('❌ Invalid chat request:', result.error.errors);
      return res.status(400).json({
        error: 'Invalid request',
        details: result.error.errors,
      });
    }

    const { session_id, content, current_step, company_url, current_content, user_language } = result.data;
    
    console.log('📝 Processing chat:', {
      session_id: session_id.substring(0, 8) + '...',
      content: content.substring(0, 50) + '...',
      current_step,
      has_current_content: !!current_content,
      current_content_length: current_content?.length || 0,
      current_content_preview: current_content?.substring(0, 100) + '...' || 'NONE',
      user_language
    });

    // Verify session exists
    const { data: session, error: sessionError } = await supabase
      .from('kb_sessions')
      .select('*')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({
        error: 'Session not found',
      });
    }

    // Generate AI response based on context
    console.log('🤖 Generating AI response...');
    let aiResponse;
    try {
      aiResponse = await generateContextualResponse(content, {
        currentStep: current_step,
        companyUrl: company_url || '',
        sessionId: session_id,
        currentContent: current_content || '',
        userLanguage: user_language || 'en-US', // Pass user language
      });
      console.log('✅ AI response generated successfully');
    } catch (error) {
      console.error('❌ AI response generation failed:', error);
      return res.status(500).json({
        error: 'AI response failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Save chat message to database
    await supabase
      .from('kb_chat_messages')
      .insert({
        session_id: session_id,
        role: 'user',
        content: content,
        context_step: current_step,
      });

    await supabase
      .from('kb_chat_messages')
      .insert({
        session_id: session_id,
        role: 'assistant',
        content: aiResponse,
        context_step: current_step,
      });

    return res.json({
      id: Date.now().toString(),
      session_id: session_id,
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Chat] Error:', error);

    if (error instanceof Error) {
      return res.status(500).json({
        error: 'Chat failed',
        message: error.message,
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
    });
  }
});

/**
 * Generate contextual AI response based on user message and context
 */
async function generateContextualResponse(
  message: string, 
  context: {
    currentStep: string;
    companyUrl: string;
    sessionId: string;
    currentContent?: string;
    userLanguage?: string;
    chatHistory?: Array<{
      id: string;
      role: 'user' | 'assistant';
      content: string;
      timestamp: Date;
    }>;
  }
): Promise<string> {
  // Map language codes to full language names
  const languageMap: Record<string, string> = {
    'en-US': 'English (US)',
    'en-GB': 'English (UK)', 
    'pt-BR': 'Portuguese (Brazil)',
    'pt-PT': 'Portuguese (Portugal)'
  };

  const userLanguage = context.userLanguage || 'en-US';
  const languageName = languageMap[userLanguage] || 'English (US)';

  // Build context-aware prompt
  const systemPrompt = `You are Wit, a helpful AI assistant for the Knowledge Base Builder project. You're currently helping with step "${context.currentStep}".

CONTEXT:
- Current Step: ${context.currentStep}
- Company URL: ${context.companyUrl || 'Not specified'}
- Session ID: ${context.sessionId}
- User Language: ${languageName} (${userLanguage})
${context.currentContent ? `- Current Content: ${context.currentContent.substring(0, 1000)}...` : ''}

INSTRUCTIONS:
- Be helpful and conversational
- Focus on accuracy and fact-checking
- If the user questions information accuracy, help them verify it
- If they want changes, suggest specific improvements
- Always maintain a professional but friendly tone
- Reference the current step when relevant
- IMPORTANT: You can see and reference the current content displayed on the left side of the screen
- When users ask about "the output on the left" or "the results", refer to the current content provided above
- CRITICAL: Respond in ${languageName}. Use appropriate regional spelling and conventions for ${userLanguage}
- LANGUAGE REQUIREMENT: You MUST respond in ${languageName} - never respond in English if the user is using ${languageName}
- If the user writes in Portuguese, respond in Portuguese. If English, respond in English.

RESPONSE GUIDELINES:
- Keep responses concise but helpful
- If you don't know something, say so
- Suggest specific actions when appropriate
- Be encouraging about the research process
- Use the company URL only when specifically discussing the company, not in greetings
- Always reference the actual content when users ask about what they see on screen
- Respond in ${languageName} with appropriate regional conventions

CRITICAL GREETING RULES:
- DO NOT repeat welcome messages or introductions in every response
- DO NOT say "Hello! I'm Wit" or similar greetings unless it's the very first message
- DO NOT mention being a "Knowledge Base Builder companion" repeatedly
- Jump straight to answering the user's question or request
- Only use greetings for the first interaction in a conversation

CONTENT EDITING CAPABILITIES - CRITICAL:
- You CAN and MUST edit the report content when users ask you to change, add, update, or modify ANYTHING
- When users say "add a section", "write about X", "change Y", "fix Z" - you MUST edit the content
- DO NOT just explain what you would do - ACTUALLY DO IT using [EDIT_CONTENT]
- DO NOT ask for permission or more information - just add/change the content based on what you know

HOW TO EDIT CONTENT:
1. Take the Current Content shown above
2. Make the requested changes (add section, modify text, fix errors, etc.)
3. Use [EDIT_CONTENT] followed by the COMPLETE updated markdown
4. You MUST include ALL the content, not just the new/changed parts

EXAMPLE - User asks to add a section:
"I've added a section about GenAI services.

[EDIT_CONTENT]
# Company Overview

[...existing content...]

## GenAI Services

MadeInWeb offers cutting-edge Generative AI solutions including...

[...rest of all content...]"

CRITICAL: If you DON'T use [EDIT_CONTENT], the report will NOT change! Users expect to see changes immediately!`;

  const userPrompt = `User message: "${message}"

${context.chatHistory && context.chatHistory.length > 0 ? `
Recent conversation:
${context.chatHistory.slice(-5).map(msg => `${msg.role}: ${msg.content}`).join('\n')}
` : ''}

Respond directly to the user's question or request. Do not include greetings or introductions unless this is the very first message in the conversation.`;

    try {
      console.log('🌐 Calling OpenAI API...');
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000, // Increased to allow complete content updates with full context
        }),
      });

      console.log('📡 OpenAI API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ OpenAI API error:', response.status, response.statusText, errorText);
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json() as {
        choices?: Array<{
          message?: {
            content?: string;
          };
        }>;
      };

      console.log('📊 OpenAI API response data:', {
        hasChoices: !!data.choices,
        choicesLength: data.choices?.length,
        hasMessage: !!data.choices?.[0]?.message,
        hasContent: !!data.choices?.[0]?.message?.content
      });

      if (
        !data ||
        !Array.isArray(data.choices) ||
        data.choices.length === 0 ||
        !data.choices[0].message?.content
      ) {
        console.error('❌ Invalid OpenAI response format:', data);
        throw new Error('Invalid response from OpenAI API');
      }

    const aiResponse = data.choices[0].message.content;

    console.log('🤖 Wit Response:', aiResponse.substring(0, 200) + '...');

    // Check if the response contains content editing commands
    const editContentMatch = aiResponse.match(/\[EDIT_CONTENT\](.*)/s);
    
    if (editContentMatch) {
      console.log('✏️ EDIT_CONTENT command detected!');
      const updatedContent = editContentMatch[1].trim();
      console.log('📝 Updated content length:', updatedContent.length);
      console.log('📝 Updated content preview:', updatedContent.substring(0, 200) + '...');
      
      // Update the content in the database
      try {
        const updateResponse = await fetch('http://localhost:3001/api/chat/update-content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: context.sessionId,
            step: context.currentStep,
            updated_content: updatedContent,
            reason: `User requested changes: ${message}`,
          }),
        });

        if (updateResponse.ok) {
          const result = await updateResponse.json();
          console.log('✅ Content updated successfully:', result);
        } else {
          const errorText = await updateResponse.text();
          console.error('❌ Failed to update content:', errorText);
        }
      } catch (error) {
        console.error('❌ Error updating content:', error);
      }

      // Return the response without the edit command
      const cleanResponse = aiResponse.replace(/\[EDIT_CONTENT\].*/s, '').trim();
      console.log('🧹 Clean response:', cleanResponse);
      return cleanResponse;
    } else {
      console.log('ℹ️ No EDIT_CONTENT command in response');
      
      // FALLBACK: If Wit didn't use the command but the user asked for changes,
      // let's try to detect if this looks like updated content
      const userWantsChanges = /adicionar|adiciona|escreve|escrever|mudar|mudar|alterar|alterar|change|add|write|modify/i.test(message);
      
      if (userWantsChanges && aiResponse.length > 500) {
        console.log('🔄 FALLBACK: User wants changes and response is long - treating as content update');
        
        // Try to extract markdown content from the response
        const markdownMatch = aiResponse.match(/(# .*)/s);
        if (markdownMatch) {
          console.log('📝 Detected markdown content in response - attempting update');
          
          try {
            const updateResponse = await fetch('http://localhost:3001/api/chat/update-content', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                session_id: context.sessionId,
                step: context.currentStep,
                updated_content: aiResponse,
                reason: `Fallback update for user request: ${message}`,
              }),
            });

            if (updateResponse.ok) {
              const result = await updateResponse.json();
              console.log('✅ Fallback content update successful:', result);
            } else {
              const errorText = await updateResponse.text();
              console.error('❌ Fallback update failed:', errorText);
            }
          } catch (error) {
            console.error('❌ Fallback update error:', error);
          }
        }
      }
    }

    return aiResponse;

  } catch (error) {
    console.error('[Chat] OpenAI API error:', error);
    
    // Fallback response
    return `I apologize, but I'm having trouble processing your request right now. Please try again in a moment. If the issue persists, you can try rephrasing your question or contact support.`;
  }
}

// GET /api/chat/:sessionId - Fetch chat history for a session
router.get('/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const { data, error } = await supabase
      .from('kb_chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching chat history:', error);
      return res.status(500).json({ message: 'Failed to fetch chat history', error });
    }

    return res.json(data?.map(msg => ({
      ...msg,
      timestamp: msg.created_at
    })));
  } catch (error) {
    console.error('[Chat GET] Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/chat/:sessionId - Clear all chat messages for a session
router.delete('/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const { error } = await supabase
      .from('kb_chat_messages')
      .delete()
      .eq('session_id', sessionId);

    if (error) {
      console.error('Error clearing chat messages:', error);
      return res.status(500).json({ message: 'Failed to clear chat messages', error });
    }

    return res.json({ message: 'Chat messages cleared successfully' });
  } catch (error) {
    console.error('[Chat DELETE] Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/chat/update-content - Update step content
router.post('/update-content', async (req: Request, res: Response) => {
  try {
    const result = ContentUpdateSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: result.error.errors,
      });
    }

    const { session_id, step, updated_content, reason } = result.data;

    // Update the document in the database
    const { error } = await supabase
      .from('kb_documents')
      .update({
        content_md: updated_content,
        updated_at: new Date().toISOString(),
      })
      .eq('session_id', session_id)
      .eq('doc_type', step);

    if (error) {
      console.error('Error updating content:', error);
      return res.status(500).json({ 
        error: 'Failed to update content',
        details: error.message 
      });
    }

    // Log the update for debugging
    console.log(`📝 Content updated for session ${session_id}, step ${step}`);
    if (reason) {
      console.log(`📝 Reason: ${reason}`);
    }

    return res.json({ 
      success: true, 
      message: 'Content updated successfully',
      step,
      reason 
    });

  } catch (error) {
    console.error('[Content Update] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
