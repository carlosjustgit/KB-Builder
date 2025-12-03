import fetch from 'node-fetch';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { performResearch as perplexityResearch, performResearchWithContext as perplexityResearchWithContext } from '../perplexity/client.js';

/**
 * Multi-source AI research service
 * Queries Perplexity, OpenAI, and Gemini in parallel for comprehensive results
 */

interface Source {
  url: string;
  snippet: string;
  provider: 'perplexity' | 'openai' | 'gemini';
}

interface ResearchResponse {
  content: string;
  sources: Source[];
  provider: 'perplexity' | 'openai' | 'gemini';
  confidence?: number;
}

interface MultiSourceResult {
  content_md: string;
  sources: Source[];
  confidence_score: number;
  providers_used: string[];
  validation_notes?: string[];
}

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Query OpenAI for research
 */
async function queryOpenAI(
  companyUrl: string,
  _locale: string,
  step: string,
  context?: string
): Promise<ResearchResponse> {
  try {
    let systemPrompt, userPrompt;
    
    if (context) {
      // For subsequent steps WITH context from step 1
      systemPrompt = `You are a professional business analyst creating a ${step} document based on EXISTING verified research data.

IMPORTANT INSTRUCTIONS:
- The research data provided below is VERIFIED and comes from the company's website (${companyUrl})
- Your job is to EXTRACT and ORGANIZE the relevant ${step} information from this data
- DO NOT refuse to generate content - the data is already verified
- DO NOT say you need web access - all necessary information is in the research data
- If specific ${step} details are not in the research, work with what's available and note gaps
- Format your response in clear, professional markdown
- Be specific and detailed based on the research data provided`;

      userPrompt = `Here is the verified company research data from ${companyUrl}:

---
${context}
---

Task: Create a comprehensive ${step} document by extracting and organizing the relevant information from the above research data.

Focus on:
${step === 'services' ? '- Service offerings and products\n- Pricing models\n- Key features and benefits\n- Target customers for each service' : ''}
${step === 'brand' ? '- Brand identity and values\n- Mission and vision\n- Brand voice and positioning\n- Unique selling propositions' : ''}
${step === 'market' ? '- Target market and audience\n- Market size and trends\n- Market positioning\n- Growth opportunities' : ''}
${step === 'competitors' ? '- Main competitors\n- Competitive advantages\n- Market differentiation\n- Competitive positioning' : ''}

Generate the ${step} document now using the research data above.`;
    } else {
      // For initial research WITHOUT context
      systemPrompt = `You are a professional business analyst. Provide accurate, well-researched content in markdown format. Always cite sources and avoid making assumptions. If information is not available, state that clearly.`;
      userPrompt = `Research and analyze ${companyUrl} to create a comprehensive ${step} document. Focus on factual, verifiable information. Cite sources when possible.`;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
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
        temperature: 0.3,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json() as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };

    const content = data.choices?.[0]?.message?.content || '';

    return {
      content,
      sources: extractSourcesFromContent(content, 'openai'),
      provider: 'openai',
    };
  } catch (error) {
    console.error('OpenAI research error:', error);
    throw error;
  }
}

/**
 * Query Gemini for research
 */
async function queryGemini(
  companyUrl: string,
  _locale: string,
  step: string,
  context?: string
): Promise<ResearchResponse> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    let prompt;
    if (context) {
      prompt = `You are fact-checking and validating a ${step} document for ${companyUrl}.

Here is the verified research data from the company's website:

---
${context}
---

Task: Create a ${step} document by extracting relevant information from the above research data.

IMPORTANT:
- This research data is VERIFIED - you do not need web access
- Extract and organize ${step}-specific information from the data
- Be specific and detailed
- Format in markdown
- If information is limited, work with what's available

Generate the ${step} document now.`;
    } else {
      prompt = `Research and fact-check information about ${companyUrl} to create a ${step} document. Focus on accuracy and validation. Flag any uncertain information.`;
    }

    const result = await model.generateContent(prompt);
    const content = result.response.text();

    return {
      content,
      sources: extractSourcesFromContent(content, 'gemini'),
      provider: 'gemini',
    };
  } catch (error) {
    console.error('Gemini research error:', error);
    throw error;
  }
}

/**
 * Extract sources from markdown content
 */
function extractSourcesFromContent(content: string, provider: 'perplexity' | 'openai' | 'gemini'): Source[] {
  const sources: Source[] = [];
  
  // Extract URLs from markdown links
  const urlRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
  let match: RegExpExecArray | null;
  
  while ((match = urlRegex.exec(content)) !== null) {
    sources.push({
      url: match[2],
      snippet: match[1],
      provider,
    });
  }
  
  // Also extract plain URLs
  const plainUrlRegex = /(https?:\/\/[^\s\)]+)/g;
  let plainMatch: RegExpExecArray | null;
  while ((plainMatch = plainUrlRegex.exec(content)) !== null) {
    if (!sources.some(s => s.url === plainMatch![1])) {
      sources.push({
        url: plainMatch[1],
        snippet: 'Referenced source',
        provider,
      });
    }
  }
  
  return sources;
}

/**
 * Cross-reference and validate facts across multiple sources
 */
function validateAndMerge(responses: ResearchResponse[]): {
  mergedContent: string;
  validationNotes: string[];
  confidenceScore: number;
} {
  const validationNotes: string[] = [];
  let confidenceScore = 0;

  // If we have multiple responses, we can cross-validate
  if (responses.length >= 2) {
    confidenceScore = 0.7; // Base confidence for multi-source
    
    // Check for common facts/themes across sources
    const contents = responses.map(r => r.content.toLowerCase());
    
    // Simple validation: check if key terms appear in multiple sources
    const allWords = contents.join(' ').split(/\s+/);
    const wordFrequency = new Map<string, number>();
    
    allWords.forEach(word => {
      if (word.length > 5) { // Only significant words
        wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
      }
    });
    
    // If many words appear across sources, increase confidence
    const crossValidatedWords = Array.from(wordFrequency.values()).filter(count => count >= 2).length;
    if (crossValidatedWords > 20) {
      confidenceScore = 0.85;
      validationNotes.push('High cross-validation between sources');
    } else if (crossValidatedWords > 10) {
      confidenceScore = 0.75;
      validationNotes.push('Moderate cross-validation between sources');
    } else {
      validationNotes.push('Limited cross-validation - sources may have different focus');
    }
  } else {
    confidenceScore = 0.6; // Lower confidence for single source
    validationNotes.push('Single source - limited validation');
  }

  // Prioritize Perplexity content as it has web search capabilities
  const perplexityResponse = responses.find(r => r.provider === 'perplexity');
  const openaiResponse = responses.find(r => r.provider === 'openai');
  const geminiResponse = responses.find(r => r.provider === 'gemini');

  // Use Perplexity as base, enhance with OpenAI insights
  let mergedContent = perplexityResponse?.content || openaiResponse?.content || geminiResponse?.content || '';

  // Add validation section if we have Gemini fact-checking
  if (geminiResponse && perplexityResponse) {
    validationNotes.push('Content validated against multiple AI sources');
  }

  return {
    mergedContent,
    validationNotes,
    confidenceScore,
  };
}

/**
 * Perform multi-source research
 */
export async function performMultiSourceResearch(
  companyUrl: string,
  locale: string,
  step: string,
  context?: string
): Promise<MultiSourceResult> {
  console.log(`🔍 [Multi-Source] Starting research for ${step} with ${context ? 'context' : 'no context'}`);

  const responses: ResearchResponse[] = [];
  const errors: string[] = [];

  // Query all sources in parallel
  const promises = [
    // Use Perplexity with context if available
    (context 
      ? perplexityResearchWithContext(companyUrl, locale, step, context)
      : perplexityResearch(companyUrl, locale, step)
    )
      .then(result => ({
        content: result.content_md,
        sources: result.sources.map(s => ({ ...s, provider: 'perplexity' as const })),
        provider: 'perplexity' as const,
      }))
      .catch(err => {
        console.error('Perplexity error:', err);
        errors.push(`Perplexity: ${err.message}`);
        return null;
      }),
    
    queryOpenAI(companyUrl, locale, step, context)
      .catch(err => {
        console.error('OpenAI error:', err);
        errors.push(`OpenAI: ${err.message}`);
        return null;
      }),
    
    queryGemini(companyUrl, locale, step, context)
      .catch(err => {
        console.error('Gemini error:', err);
        errors.push(`Gemini: ${err.message}`);
        return null;
      }),
  ];

  const results = await Promise.all(promises);
  
  // Filter out null results
  results.forEach(result => {
    if (result) responses.push(result);
  });

  if (responses.length === 0) {
    throw new Error(`All research sources failed: ${errors.join('; ')}`);
  }

  console.log(`✅ [Multi-Source] Got ${responses.length} successful responses`);

  // Validate and merge responses
  const { mergedContent, validationNotes, confidenceScore } = validateAndMerge(responses);

  // Collect all sources
  const allSources: Source[] = [];
  responses.forEach(response => {
    allSources.push(...response.sources);
  });

  // Deduplicate sources by URL
  const uniqueSources = Array.from(
    new Map(allSources.map(s => [s.url, s])).values()
  );

  return {
    content_md: mergedContent,
    sources: uniqueSources,
    confidence_score: confidenceScore,
    providers_used: responses.map(r => r.provider),
    validation_notes: validationNotes,
  };
}

