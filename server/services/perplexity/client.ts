import fetch from 'node-fetch';

/**
 * Perplexity API client for web research
 */

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
const PERPLEXITY_MODEL = 'sonar-reasoning'; // Reasoning model for research

interface ResearchResult {
  content_md: string;
  sources: Array<{
    url: string;
    snippet: string;
    provider: 'perplexity';
  }>;
}

/**
 * Main research function that calls Perplexity API
 */
export async function performResearch(
  companyUrl: string,
  locale: string,
  step: string,
  retryCount: number = 0,
  maxRetries: number = 3
): Promise<ResearchResult> {
  try {
    console.log(`🔍 Starting research for ${step} (attempt ${retryCount + 1}/${maxRetries + 1})`);
    
    const prompt = generatePrompt(companyUrl, locale, step);

    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: PERPLEXITY_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a professional business researcher. Your job is to provide ACCURATE, VERIFIED information about companies.

🚨 CRITICAL ACCURACY REQUIREMENTS 🚨
- ONLY use information from official company sources (website, social media, press releases)
- VERIFY facts by cross-referencing multiple sources
- If information conflicts, prioritize official company sources
- If you cannot find specific information, state "Information not available" rather than guessing
- NEVER make up or assume facts about founding dates, locations, or company history
- Always cite your sources with URLs
- DO NOT include reasoning tags like <think> or internal processing steps
- Provide complete, finished responses only

⚠️ ANTI-HALLUCINATION PROTOCOL:
- Before stating ANY fact, ask yourself: "Do I have a direct source for this?"
- If uncertain about ANY detail, write "Information not available" instead
- Cross-reference founding dates, locations, and company history from multiple sources
- If sources conflict, state the conflict and cite both sources
- NEVER fill in gaps with assumptions or generic information

Your credibility depends on accuracy. False information damages trust and business relationships.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Lower temperature for more factual responses
        max_tokens: 4000, // Increased for comprehensive responses
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json() as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
      citations?: string[];
    };

    let content = data.choices?.[0]?.message?.content || '';
    
    // Validate content
    if (!content || content.trim().length < 50) {
      throw new Error('Invalid research result: content too short or empty');
    }
    
    // Remove reasoning tags if present (sonar-reasoning model includes these)
    if (content.includes('<think>') || content.includes('</think>')) {
      console.log('⚠️ Removing reasoning tags from response');
      content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    }

    const result = parseResearchResponse(content, companyUrl);
    
    // Validate parsed result
    if (!result.content_md || result.content_md.trim().length < 50) {
      throw new Error('Invalid research result: parsed content too short');
    }
    
    console.log('✅ Research validation passed');
    return result;
    
  } catch (error) {
    console.error(`[Perplexity] Research failed (attempt ${retryCount + 1}):`, error);
    
    // Retry logic with exponential backoff
    if (retryCount < maxRetries) {
      const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
      console.log(`⏳ Retrying in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return performResearch(companyUrl, locale, step, retryCount + 1, maxRetries);
    }
    
    throw error;
  }
}

/**
 * Generate prompt with context from previous steps
 */
function generatePromptWithContext(companyUrl: string, locale: string, step: string, context: string): string {
  const basePrompt = generatePrompt(companyUrl, locale, step);
  
  if (step === 'competitors') {
    return `=== RESEARCH DATA FROM STEP 1 ===
${context}

=== COMPETITOR ANALYSIS REQUEST ===
${basePrompt}`;
  } else if (step === 'brand') {
    return `=== RESEARCH DATA FROM STEP 1 ===
${context}

=== BRAND IDENTITY REQUEST ===
${basePrompt}`;
  } else if (step === 'market') {
    return `=== RESEARCH DATA FROM STEP 1 ===
${context}

=== MARKET ANALYSIS REQUEST ===
${basePrompt}`;
  } else {
    return `=== RESEARCH DATA FROM STEP 1 ===
${context}

=== ${step.toUpperCase()} REQUEST ===
${basePrompt}`;
  }
}

/**
 * Research function with context from previous steps with retry logic
 */
export async function performResearchWithContext(
  companyUrl: string,
  locale: string,
  step: string,
  context: string,
  retryCount: number = 0,
  maxRetries: number = 3
): Promise<ResearchResult> {
  try {
    console.log(`🔄 Performing research with context for step: ${step} (attempt ${retryCount + 1}/${maxRetries + 1})`);
    console.log('📊 Context length:', context.length);
    console.log('🏢 Company URL:', companyUrl);
    
    const prompt = generatePromptWithContext(companyUrl, locale, step, context);

    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: PERPLEXITY_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a business analyst. You have access to detailed research data from step 1 about a company. You MUST use this research data to understand the company's business model, target audience, and market positioning before creating ${step === 'competitors' ? 'competitor analysis' : step === 'brand' ? 'brand identity document' : step === 'market' ? 'market analysis' : step + ' content'}. Do not say you don't have information about the company - use the provided research data.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7, // Balance creativity and consistency
        max_tokens: 2000, // Sufficient for research responses
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json() as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
      citations?: string[];
    };

    if (
      !data ||
      !Array.isArray(data.choices) ||
      !data.choices[0] ||
      !data.choices[0].message ||
      typeof data.choices[0].message.content !== 'string'
    ) {
      throw new Error('Invalid response format from Perplexity API');
    }
    
    let content = data.choices[0].message.content;
    
    // Validate content
    if (!content || content.trim().length < 50) {
      throw new Error('Invalid research result: content too short or empty');
    }
    
    // Remove reasoning tags if present (sonar-reasoning model includes these)
    if (content.includes('<think>') || content.includes('</think>')) {
      console.log('⚠️ Removing reasoning tags from response');
      content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    }
    
    const result = parseResearchResponse(content, companyUrl);
    
    // Validate parsed result
    if (!result.content_md || result.content_md.trim().length < 50) {
      throw new Error('Invalid research result: parsed content too short');
    }
    
    console.log('✅ Research with context validation passed');
    return result;

  } catch (error) {
    console.error(`[Perplexity] Research with context failed (attempt ${retryCount + 1}):`, error);
    
    // Retry logic with exponential backoff
    if (retryCount < maxRetries) {
      const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
      console.log(`⏳ Retrying in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return performResearchWithContext(companyUrl, locale, step, context, retryCount + 1, maxRetries);
    }
    
    throw error;
  }
}

/**
 * Generate appropriate prompt based on research step
 */
function generatePrompt(companyUrl: string, locale: string, step: string): string {
  const baseUrl = extractBaseUrl(companyUrl);

  switch (step) {
    case 'research':
      return generateBrandOverviewPrompt(baseUrl, locale);

    case 'brand':
      return generateBrandTonePrompt(baseUrl, locale);

    case 'services':
      return generateServicesPrompt(baseUrl, locale);

    case 'market':
      return generateMarketTrendsPrompt(baseUrl, locale);

    case 'competitors':
      return generateCompetitorsPrompt(baseUrl, locale);

    default:
      throw new Error(`Unknown research step: ${step}`);
  }
}

/**
 * Extract base URL from company URL (remove protocol and path)
 */
function extractBaseUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.hostname}`;
  } catch {
    // If URL parsing fails, return as-is
    return url;
  }
}

/**
 * Parse Perplexity response to extract content and sources
 */
function parseResearchResponse(content: string, _companyUrl: string): ResearchResult {
  // Remove reasoning tags and internal processing steps
  let cleanedContent = content
    .replace(/<think>[\s\S]*?<\/think>/gi, '') // Remove <think> tags
    .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '') // Remove <reasoning> tags
    .replace(/<analysis>[\s\S]*?<\/analysis>/gi, '') // Remove <analysis> tags
    .replace(/<thought>[\s\S]*?<\/thought>/gi, '') // Remove <thought> tags
    .replace(/Let me carefully analyze[\s\S]*?\./gi, '') // Remove analysis statements
    .replace(/I need to[\s\S]*?\./gi, '') // Remove "I need to" statements
    .replace(/First, let me[\s\S]*?\./gi, '') // Remove "First, let me" statements
    .trim();

  // Split content to separate main content from sources
  const lines = cleanedContent.split('\n');
  const sources: Array<{ url: string; snippet: string; provider: 'perplexity' }> = [];
  const mainContent: string[] = [];

  let inSourcesSection = false;

  for (const line of lines) {
    if (line.toLowerCase().includes('sources:') || line.toLowerCase().includes('citations:')) {
      inSourcesSection = true;
      continue;
    }

    if (inSourcesSection) {
      // Look for URL patterns in sources
      const urlMatch = line.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        const url = urlMatch[0];
        const snippet = line.replace(url, '').trim();
        sources.push({
          url,
          snippet,
          provider: 'perplexity',
        });
      }
    } else {
      if (line.trim()) {
        mainContent.push(line.trim());
      }
    }
  }

  // Add accuracy warning if no sources found
  if (sources.length === 0) {
    console.warn('⚠️ No sources found in research response - accuracy may be compromised');
  }

  // Post-processing fact-checking
  const factCheckedContent = performFactCheck(mainContent.join('\n\n'), sources);

  return {
    content_md: factCheckedContent,
    sources,
  };
}

/**
 * Post-processing fact-checking to catch potential hallucinations
 */
function performFactCheck(content: string, sources: Array<{ url: string; snippet: string; provider: string }>): string {
  console.log('🔍 Performing post-processing fact-check...');
  
  // Check for common hallucination patterns
  const suspiciousPatterns = [
    /founded in \d{4}/gi,
    /established in \d{4}/gi,
    /since \d{4}/gi,
    /located in [^,]+/gi,
    /headquartered in [^,]+/gi,
    /based in [^,]+/gi,
  ];

  let warnings: string[] = [];
  
  suspiciousPatterns.forEach((pattern) => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // Check if this fact is supported by sources
        const hasSourceSupport = sources.some(source => 
          source.snippet.toLowerCase().includes(match.toLowerCase()) ||
          source.url.includes('about') ||
          source.url.includes('company')
        );
        
        if (!hasSourceSupport) {
          warnings.push(`⚠️ Unverified fact: "${match}" - no source support found`);
        }
      });
    }
  });

  if (warnings.length > 0) {
    console.warn('🚨 Fact-checking warnings:', warnings);
    
    // Add warning to content
    const warningText = `\n\n⚠️ **ACCURACY WARNING**: The following information may not be verified:\n${warnings.join('\n')}\n\nPlease verify these facts from official company sources.`;
    return content + warningText;
  }

  console.log('✅ Fact-check passed - no suspicious patterns detected');
  return content;
}

/**
 * Generate brand overview research prompt
 */
function generateBrandOverviewPrompt(companyUrl: string, locale: string): string {
  return `Research the company at ${companyUrl} and provide a comprehensive brand overview.

🚨 CRITICAL ACCURACY REQUIREMENTS 🚨
- ONLY use information from official company sources (website, social media, press releases)
- VERIFY facts by cross-referencing multiple sources
- If information conflicts between sources, prioritize official company sources
- If you cannot find specific information, state "Information not available" rather than guessing
- NEVER make up or assume facts about founding dates, locations, or company history
- DO NOT include reasoning tags like <think> or internal processing steps

⚠️ ANTI-HALLUCINATION PROTOCOL:
- Before stating ANY fact, ask yourself: "Do I have a direct source for this?"
- If uncertain about ANY detail, write "Information not available" instead
- Cross-reference founding dates, locations, and company history from multiple sources
- If sources conflict, state the conflict and cite both sources
- NEVER fill in gaps with assumptions or generic information

Research Requirements:
- Output in ${locale} language
- Provide a comprehensive overview (not limited to 4 sentences)
- Include: mission/essence, target audience, positioning, key differentiators, company background
- Return 3-5 sources with URLs and short snippets
- Avoid generic corporate language
- Focus on verifiable facts from official sources
- Provide complete, finished content only

ACCURACY CHECKLIST:
✓ Company background and history (if available from official sources)
✓ Company location/headquarters (if available from official sources)  
✓ Core business model and services
✓ Target audience and market positioning
✓ Key differentiators based on actual offerings
✓ Mission statement or company purpose

Format your response as:
# Company Overview

[Comprehensive brand overview with verified facts only]

## Key Information
- **Industry**: [if available]
- **Founded**: [if available from official sources]
- **Location**: [if available from official sources]
- **Mission**: [if available]

## Target Audience
[Description of target audience based on official sources]

## Key Differentiators
1. [Differentiator based on actual offerings]
2. [Differentiator based on actual offerings]
3. [Differentiator based on actual offerings]

## Sources
1. [URL] - [Brief snippet]
2. [URL] - [Brief snippet]
3. [URL] - [Brief snippet]`;
}

/**
 * Generate comprehensive brand identity document
 */
function generateBrandTonePrompt(companyUrl: string, locale: string): string {
  return `Create a comprehensive brand identity document for the company at ${companyUrl}. Reference the research data from step 1 to understand their business model, target audience, and market positioning.

Requirements:
- Output in ${locale} language
- Create a structured brand identity document with the following sections:
  * Mission Statement
  * Vision Statement
  * Core Values (3-4 values)
  * Brand Promise
  * Brand Personality (3-4 personality traits)
  * Target Audience (detailed description)
- Use markdown formatting with ## for section headers
- Be specific and authentic based on the research data
- Avoid generic corporate language
- Build upon the research data from step 1 - use the company overview, audience insights, and positioning information already collected

Format your response as a structured markdown document that captures their unique essence and market position based on the research data.

Sources:
Provide 3-5 relevant sources with URLs and short snippets that support your analysis.`;
}

/**
 * Generate services research prompt
 */
function generateServicesPrompt(companyUrl: string, locale: string): string {
  return `Research the main services offered by the company at ${companyUrl}. Reference the research data from step 1 to understand their business model and service offerings.

Requirements:
- Output in ${locale} language
- List 3-5 core services
- For each service: provide 1 paragraph description (benefit + target audience)
- Keep descriptions concrete and specific, avoid generic language
- Focus on actual services mentioned on their site
- Build upon the research data from step 1 - use the company overview and business model information

Format your response as:
Services:

1. [Service Name]
[One paragraph description focusing on benefits and who it's for, based on research data]

2. [Service Name]
[One paragraph description...]

Sources:
1. [URL] - [Service-related snippet]`;
}

/**
 * Generate market trends research prompt
 */
function generateMarketTrendsPrompt(companyUrl: string, locale: string): string {
  return `Research current market trends that affect the business at ${companyUrl}. Reference the research data from step 1 to understand their industry and market positioning.

Requirements:
- Output in ${locale} language
- Identify 2-3 current trends in their industry/market
- For each trend: explain in 2 lines what it is and why it matters
- Add 2-3 actionable takeaways for social media strategy
- Include 3-5 recent sources with dates and URLs
- Build upon the research data from step 1 - use the company overview and industry context

Format your response as:
Market Trends:

1. [Trend Name]
[2-line explanation]

Takeaways for Strategy:
- [Actionable insight based on company research]
- [Actionable insight based on company research]

2. [Trend Name]
[2-line explanation]

Takeaways for Strategy:
- [Actionable insight]
- [Actionable insight]

Sources:
1. [URL] - [Date] - [Brief snippet]`;
}

/**
 * Generate competitors research prompt
 */
function generateCompetitorsPrompt(companyUrl: string, locale: string): string {
  return `You have access to detailed research data from step 1 about the company at ${companyUrl}. Use this information to identify and analyze 3 relevant competitors in their market space.

IMPORTANT: You MUST use the research data provided in the context to understand:
- What this company does (their business model, services, target audience)
- What industry/market they operate in
- Their unique value proposition and positioning

Based on this understanding, identify 3 competitors that operate in the same industry/market space.

Requirements:
- Output in ${locale} language
- Use the company overview, business model, and positioning from step 1 research to understand their market
- Identify 3 competitors that operate in the same industry/market as this company
- For each competitor: describe what they do well (2-3 specific strengths based on their actual features)
- Based on this company's actual features, target audience, and value proposition from step 1: explain how this company differentiates (2-3 key differentiators)
- Reference the specific company information from step 1 research
- Include sources for verification

Format your response as:
Competitors:

1. [Competitor Name]
Strengths:
- [specific strength based on their features]
- [specific strength based on their features]

2. [Competitor Name]
Strengths:
- [specific strength based on their features]
- [specific strength based on their features]

Differentiators:
- [How this company is different based on its step 1 research data]
- [Key differentiator based on company positioning from research]
- [Key differentiator based on company advantages from research]

Sources:
1. [URL] - [Brief snippet]`;
}

