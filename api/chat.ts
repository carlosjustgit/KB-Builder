import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { supabase } from '../server/services/supabase/client.js';

// Validation schema for chat requests
const ChatRequestSchema = z.object({
  session_id: z.string().uuid(),
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1),
  current_step: z.string(),
  company_url: z.string().url().optional(),
  current_content: z.string().optional(),
  user_language: z.string().optional(),
});

/**
 * POST /api/chat
 * Conversational AI endpoint for user interactions
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
        userLanguage: user_language || 'en-US',
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
}

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
        max_tokens: 2000,
      }),
    });

    console.log('📡 OpenAI API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error:', response.status, response.statusText, errorText);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };

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
      
      // Update the content in the database
      try {
        const { error } = await supabase
          .from('kb_documents')
          .update({
            content_md: updatedContent,
            updated_at: new Date().toISOString(),
          })
          .eq('session_id', context.sessionId)
          .eq('doc_type', context.currentStep);

        if (error) {
          console.error('❌ Failed to update content:', error);
        } else {
          console.log('✅ Content updated successfully');
        }
      } catch (error) {
        console.error('❌ Error updating content:', error);
      }

      // Return the response without the edit command
      const cleanResponse = aiResponse.replace(/\[EDIT_CONTENT\].*/s, '').trim();
      return cleanResponse;
    }

    return aiResponse;

  } catch (error) {
    console.error('[Chat] OpenAI API error:', error);
    
    // Fallback response
    return `I apologize, but I'm having trouble processing your request right now. Please try again in a moment.`;
  }
}

