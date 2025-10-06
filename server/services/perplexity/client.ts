import fetch from 'node-fetch';

/**
 * Perplexity API client for web research
 */

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
const PERPLEXITY_MODEL = 'sonar-small-online'; // Good balance of quality and speed

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
  step: string
): Promise<ResearchResult> {
  try {
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
    return parseResearchResponse(data.choices[0].message.content, companyUrl);

  } catch (error) {
    console.error('[Perplexity] Research failed:', error);
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
  // Split content to separate main content from sources
  const lines = content.split('\n');
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

  return {
    content_md: mainContent.join('\n\n'),
    sources,
  };
}

/**
 * Generate brand overview research prompt
 */
function generateBrandOverviewPrompt(companyUrl: string, locale: string): string {
  return `Research the company at ${companyUrl} and provide a concise brand overview.

Requirements:
- Output in ${locale} language
- Maximum 4 sentences
- Include: mission/essence, target audience, positioning, 3 key differentiators
- Return 3-5 sources with URLs and short snippets
- Avoid generic corporate language

Format your response as:
[Main content paragraph]

Sources:
1. [URL] - [Brief snippet]
2. [URL] - [Brief snippet]
...`;
}

/**
 * Generate brand tone research prompt
 */
function generateBrandTonePrompt(companyUrl: string, locale: string): string {
  return `Analyze the brand voice and tone used on ${companyUrl}.

Requirements:
- Output in ${locale} language
- Identify 3-4 key tone traits (e.g., professional, friendly, authoritative, playful)
- Provide 3 example sentences that capture their communication style
- Focus on actual copy from their website/social media
- Be specific about their unique voice

Format your response as:
Tone Traits: [trait1], [trait2], [trait3]

Example Sentences:
1. "[Example sentence]"
2. "[Example sentence]"
3. "[Example sentence]"

Sources:
1. [URL] - [Relevant snippet]`;
}

/**
 * Generate services research prompt
 */
function generateServicesPrompt(companyUrl: string, locale: string): string {
  return `Research the main services offered by the company at ${companyUrl}.

Requirements:
- Output in ${locale} language
- List 3-5 core services
- For each service: provide 1 paragraph description (benefit + target audience)
- Keep descriptions concrete and specific, avoid generic language
- Focus on actual services mentioned on their site

Format your response as:
Services:

1. [Service Name]
[One paragraph description focusing on benefits and who it's for]

2. [Service Name]
[One paragraph description...]

Sources:
1. [URL] - [Service-related snippet]`;
}

/**
 * Generate market trends research prompt
 */
function generateMarketTrendsPrompt(companyUrl: string, locale: string): string {
  return `Research current market trends that affect the business at ${companyUrl}.

Requirements:
- Output in ${locale} language
- Identify 2-3 current trends in their industry/market
- For each trend: explain in 2 lines what it is and why it matters
- Add 2-3 actionable takeaways for social media strategy
- Include 3-5 recent sources with dates and URLs

Format your response as:
Market Trends:

1. [Trend Name]
[2-line explanation]

Takeaways for Strategy:
- [Actionable insight]
- [Actionable insight]

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
  return `Research competitors for the company at ${companyUrl}.

Requirements:
- Output in ${locale} language
- Identify 3 relevant competitors in their market/region
- For each competitor: describe what they do well (2-3 points)
- Then explain how the company differentiates (2-3 key points)
- Include sources for verification

Format your response as:
Competitors:

1. [Competitor Name]
Strengths: [what they do well]

2. [Competitor Name]
Strengths: [what they do well]

Differentiators:
- [How company is different/better]
- [How company is different/better]

Sources:
1. [URL] - [Brief snippet]`;
}

