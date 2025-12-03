import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ManualInput {
  company_description: string;
  competitors?: string[];
  services?: string;
  additional_info?: string;
}

interface ResearchResult {
  content_md: string;
  sources: Array<{ url: string; snippet: string; provider: string }>;
  quality_score: number;
}

/**
 * Generate research content from manual input using OpenAI
 */
export async function performManualResearch(
  manualInput: ManualInput,
  _locale: string,
  step: string
): Promise<ResearchResult> {
  console.log(`📝 [Manual Research] Generating ${step} content from manual input...`);

  const systemPrompt = getSystemPromptForStep(step);
  const userPrompt = buildUserPrompt(manualInput, step);

  try {
    const completion = await openai.chat.completions.create({
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
      temperature: 0.8, // Slightly higher for more creative brand content
      max_tokens: 4000, // More tokens for detailed brand documentation
    });

    const content = completion.choices[0]?.message?.content || '';

    console.log(`✅ [Manual Research] Generated ${content.length} characters`);

    return {
      content_md: content,
      sources: [], // No external sources for manual input
      quality_score: 8, // Default quality score for manual research
    };
  } catch (error) {
    console.error('❌ [Manual Research] Error:', error);
    throw new Error('Failed to generate research from manual input');
  }
}

function getSystemPromptForStep(step: string): string {
  const basePrompt = `You are an expert business analyst and content writer. Your task is to create comprehensive, professional documentation based on the user's manual input.

IMPORTANT GUIDELINES:
- Write in clear, professional markdown format
- Use proper headings (##, ###) to structure content
- Be specific and detailed, but concise
- DO NOT make up information - only use what the user provided
- If the user didn't provide certain details, acknowledge gaps professionally
- Format lists with bullet points (-)
- Use bold (**text**) for emphasis
- Write in the language requested or default to English

AVOID:
- Generic placeholder text like "Company X" or "[Insert here]"
- Assumptions about data not provided
- Overly promotional language
- Vague statements without substance`;

  const stepSpecificGuidance = {
    research: `
For RESEARCH step, create a comprehensive company overview including:
## Company Overview
- Brief description of what the company does
- Core mission and values (if provided)
- Target market and audience
- Business model overview

## Market Position
- Industry context
- Competitive landscape (if competitors mentioned)
- Unique value proposition

## Products/Services
- Main offerings
- Key features or benefits

## Additional Context
- Any other relevant information provided`,

    brand: `
For BRAND step, create comprehensive brand identity documentation:

## Mission Statement
Write a clear, compelling mission statement based on what the company does and why they exist. If not explicitly stated, infer from the company description.

## Vision Statement  
Articulate where the company aims to go and what they aspire to achieve. Create an aspirational vision based on the company's goals and purpose.

## Core Values
List 3-5 core values that guide the company. Infer these from the company description, culture clues, and business approach mentioned.

## Brand Personality
Describe the brand's personality traits (e.g., professional, innovative, friendly, authoritative, creative).

## Target Audience
Define who the company serves and their key characteristics.

## Brand Positioning
Explain how the brand differentiates itself in the market and its unique value proposition.

IMPORTANT: Do NOT write "Information not available" - instead, create well-reasoned content based on the company description provided. Be creative but authentic.`,

    services: `
For SERVICES step, document products and services:
## Services/Products Overview
- Complete list of offerings
- Detailed descriptions for each

## Service Categories
- Group similar services
- Explain differentiators

## Delivery Model
- How services are delivered
- Pricing structure (if mentioned)`,

    market: `
For MARKET step, analyze market dynamics:
## Market Overview
- Industry landscape
- Market size and trends (if known)
- Target segments

## Competitive Environment
- Main competitors and their positioning
- Market share insights (if available)
- Competitive advantages

## Opportunities and Challenges
- Growth opportunities
- Market challenges`,

    competitors: `
For COMPETITORS step, analyze competition:
## Competitive Landscape
- List key competitors
- Market positioning of each

## Competitor Analysis
For each major competitor:
- Strengths
- Weaknesses
- Market approach
- Differentiators

## Competitive Advantages
- How the company stands out
- Unique capabilities`,
  };

  return basePrompt + '\n\n' + (stepSpecificGuidance[step as keyof typeof stepSpecificGuidance] || stepSpecificGuidance.research);
}

function buildUserPrompt(manualInput: ManualInput, step: string): string {
  let prompt = `Please create comprehensive ${step} documentation based on the following information:\n\n`;

  prompt += `**Company Description:**\n${manualInput.company_description}\n\n`;

  if (manualInput.competitors && manualInput.competitors.length > 0) {
    prompt += `**Competitors:**\n`;
    manualInput.competitors.forEach(comp => {
      prompt += `- ${comp}\n`;
    });
    prompt += '\n';
  }

  if (manualInput.services) {
    prompt += `**Services/Products:**\n${manualInput.services}\n\n`;
  }

  if (manualInput.additional_info) {
    prompt += `**Additional Information:**\n${manualInput.additional_info}\n\n`;
  }

  prompt += `Generate detailed, professional ${step} documentation in markdown format. Be specific and thorough based on the information provided. If certain details are missing, work with what's available without making assumptions.`;

  return prompt;
}

