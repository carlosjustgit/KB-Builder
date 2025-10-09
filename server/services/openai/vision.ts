import { OpenAI } from 'openai';
import fetch from 'node-fetch';
import type { VisualGuideRules } from '@/types';

/**
 * OpenAI Vision service for analyzing brand images
 */

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analyze images to generate visual brand guidelines
 */
export async function analyzeImagesForGuidelines(
  imageUrls: string[],
  locale: string,
  brandContext?: string
): Promise<{
  visual_guide: VisualGuideRules;
  guide_md: string;
}> {
  try {
    console.log('🖼️ Starting vision analysis for', imageUrls.length, 'images');
    
    // Download images and convert to base64
    const imageDataUrls = await Promise.all(
      imageUrls.map(async (url) => {
        try {
          console.log('📥 Downloading image:', url);
          const response = await fetch(url);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
          }
          
          const buffer = await response.buffer();
          const base64 = buffer.toString('base64');
          const contentType = response.headers.get('content-type') || 'image/jpeg';
          
          console.log('✅ Image downloaded:', contentType, buffer.length, 'bytes');
          
          // Return as data URL for OpenAI
          return `data:${contentType};base64,${base64}`;
        } catch (error) {
          console.error('❌ Failed to download image:', url, error);
          throw new Error(`Failed to download image from ${url}`);
        }
      })
    );

    console.log('✅ All images downloaded and converted to base64');
    
    // Build the prompt for visual analysis
    const prompt = buildVisualAnalysisPrompt(imageUrls, locale, brandContext);

    // Create the vision request with base64 images
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          ...imageDataUrls.map(dataUrl => ({
            type: 'image_url' as const,
            image_url: { url: dataUrl }
          }))
        ],
      },
    ];

    console.log('🤖 Calling OpenAI Vision API...');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 2000,
      temperature: 0.7,
    });

    if (!response.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI Vision API');
    }

    console.log('✅ OpenAI Vision analysis complete');

    // Parse the response to extract visual guidelines
    return parseVisionResponse(response.choices[0].message.content, locale);

  } catch (error) {
    console.error('[OpenAI Vision] Analysis failed:', error);
    throw error;
  }
}

/**
 * Generate test images based on visual guidelines
 */
export async function generateTestImages(
  basePrompt: string,
  negativePrompt?: string,
  count: number = 1
): Promise<Array<{ url: string; storage_path: string }>> {
  try {
    const prompt = `${basePrompt}${negativePrompt ? `, ${negativePrompt}` : ''}`;

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: Math.min(count, 4), // DALL-E 3 max is 4 images
      size: '1024x1024',
      quality: 'standard',
      style: 'natural',
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('No images generated');
    }

    // Return URLs (in production, these would be uploaded to storage)
    return response.data.map((image, index) => ({
      url: image.url || '',
      storage_path: `generated/test-${Date.now()}-${index}.png`,
    }));

  } catch (error) {
    console.error('[OpenAI Images] Generation failed:', error);
    throw error;
  }
}

/**
 * Build the visual analysis prompt
 */
function buildVisualAnalysisPrompt(
  _imageUrls: string[],
  locale: string,
  brandContext?: string
): string {
  const contextSection = brandContext
    ? `Brand Context: ${brandContext}\n\n`
    : '';

  return `${contextSection}Analyze these brand images and extract comprehensive visual guidelines.

Requirements:
- Output in ${locale} language
- Extract color palette (primary, secondary, neutrals with hex codes)
- Identify lighting style and mood
- Describe composition patterns and visual elements
- Note common subjects, textures, and materials
- Define visual do's and don'ts
- Create 3 base prompts for consistent image generation
- Create negative prompts to avoid unwanted elements

Format your response as structured JSON:
{
  "palette": {
    "primary": ["#hex1", "#hex2"],
    "secondary": ["#hex3", "#hex4"],
    "neutrals": ["#hex5", "#hex6"]
  },
  "lighting": "Description of lighting style",
  "composition": "Description of composition patterns",
  "subjects": ["Common visual elements"],
  "textures": ["Material descriptions"],
  "mood": ["Emotional tone keywords"],
  "dos": ["Visual guideline do's"],
  "donts": ["Visual guideline don'ts"],
  "base_prompts": ["3 detailed prompts for image generation"],
  "negative_prompts": ["Negative prompts to avoid"]
}

Also provide a markdown summary in ${locale}.`;
}

/**
 * Parse OpenAI Vision response to extract visual guidelines
 */
function parseVisionResponse(content: string, locale: string): {
  visual_guide: VisualGuideRules;
  guide_md: string;
} {
  try {
    // Extract JSON from response (it might be wrapped in markdown)
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    let jsonContent = content;

    if (jsonMatch) {
      jsonContent = jsonMatch[1];
    }

    // Try to parse as JSON first
    let parsedData;
    try {
      parsedData = JSON.parse(jsonContent);
    } catch {
      // If JSON parsing fails, try to extract structured data from text
      parsedData = parseTextResponse(content);
    }

    // Ensure all required fields exist
    const visualGuide: VisualGuideRules = {
      palette: {
        primary: parsedData.palette?.primary || ['#000000'],
        secondary: parsedData.palette?.secondary || ['#ffffff'],
        neutrals: parsedData.palette?.neutrals || ['#f0f0f0'],
      },
      lighting: parsedData.lighting || 'Natural lighting',
      composition: parsedData.composition || 'Balanced composition',
      subjects: parsedData.subjects || ['Brand elements'],
      textures: parsedData.textures || ['Clean surfaces'],
      mood: parsedData.mood || ['Professional'],
      dos: parsedData.dos || ['Use brand colors consistently'],
      donts: parsedData.donts || ['Avoid cluttered compositions'],
      base_prompts: parsedData.base_prompts || [
        'Professional brand imagery',
        'Clean and modern design',
        'Consistent color palette'
      ],
      negative_prompts: parsedData.negative_prompts || [
        'cluttered',
        'low quality',
        'inconsistent branding'
      ],
    };

    // Generate markdown summary
    const guideMd = generateMarkdownSummary(visualGuide, locale);

    return {
      visual_guide: visualGuide,
      guide_md: guideMd,
    };

  } catch (error) {
    console.error('[Vision Parser] Failed to parse response:', error);
    throw new Error('Failed to parse visual analysis response');
  }
}

/**
 * Parse text response when JSON parsing fails
 */
function parseTextResponse(content: string): Partial<VisualGuideRules> {
  // Simple text parsing fallback
  const lines = content.split('\n');
  const result: Record<string, unknown> = {};

  let currentSection = '';

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.toLowerCase().includes('palette:')) {
      currentSection = 'palette';
    } else if (trimmedLine.toLowerCase().includes('lighting:')) {
      currentSection = 'lighting';
    } else if (trimmedLine.toLowerCase().includes('composition:')) {
      currentSection = 'composition';
    } else if (trimmedLine.toLowerCase().includes('subjects:')) {
      currentSection = 'subjects';
    } else if (trimmedLine.toLowerCase().includes('textures:')) {
      currentSection = 'textures';
    } else if (trimmedLine.toLowerCase().includes('mood:')) {
      currentSection = 'mood';
    } else if (trimmedLine.toLowerCase().includes('do\'s:')) {
      currentSection = 'dos';
    } else if (trimmedLine.toLowerCase().includes('don\'ts:')) {
      currentSection = 'donts';
    } else if (trimmedLine.toLowerCase().includes('base prompts:')) {
      currentSection = 'base_prompts';
    } else if (trimmedLine.toLowerCase().includes('negative prompts:')) {
      currentSection = 'negative_prompts';
    } else if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•')) {
      // List item
      if (!result[currentSection]) {
        result[currentSection] = [];
      }
      const value = result[currentSection];
      if (Array.isArray(value)) {
        value.push(trimmedLine.substring(1).trim());
      }
    } else if (trimmedLine && !trimmedLine.includes(':')) {
      // Value line
      if (currentSection && !Array.isArray(result[currentSection])) {
        result[currentSection] = trimmedLine;
      }
    }
  }

  return result as Partial<VisualGuideRules>;
}

/**
 * Generate markdown summary of visual guidelines
 */
function generateMarkdownSummary(guide: VisualGuideRules, _locale: string): string {
  return `# Visual Brand Guidelines

## Color Palette
- **Primary Colors:** ${guide.palette.primary.join(', ')}
- **Secondary Colors:** ${guide.palette.secondary.join(', ')}
- **Neutral Colors:** ${guide.palette.neutrals.join(', ')}

## Visual Style
- **Lighting:** ${guide.lighting}
- **Composition:** ${guide.composition}
- **Common Subjects:** ${guide.subjects.join(', ')}
- **Textures:** ${guide.textures.join(', ')}

## Brand Mood
${guide.mood.map(mood => `- ${mood}`).join('\n')}

## Visual Guidelines

### Do's
${guide.dos.map(doItem => `- ${doItem}`).join('\n')}

### Don'ts
${guide.donts.map(dont => `- ${dont}`).join('\n')}

## AI Prompts for Image Generation

### Base Prompts
${guide.base_prompts.map((prompt, index) => `${index + 1}. ${prompt}`).join('\n')}

### Negative Prompts
${guide.negative_prompts.map((prompt, index) => `${index + 1}. ${prompt}`).join('\n')}
`;
}

