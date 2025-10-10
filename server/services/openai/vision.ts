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
 * Analyze images to generate visual brand guidelines with retry logic
 */
export async function analyzeImagesForGuidelines(
  imageUrls: string[],
  locale: string,
  brandContext?: string,
  retryCount: number = 0,
  maxRetries: number = 3
): Promise<{
  visual_guide: VisualGuideRules;
  guide_md: string;
}> {
  try {
    console.log(`🖼️ Starting vision analysis for ${imageUrls.length} images (attempt ${retryCount + 1}/${maxRetries + 1})`);
    
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
    const result = parseVisionResponse(response.choices[0].message.content, locale);
    
    // Validate the result has required fields
    if (!result.visual_guide.general_principles || result.visual_guide.general_principles.length === 0) {
      throw new Error('Invalid analysis result: missing general principles');
    }
    
    console.log('✅ Analysis validation passed');
    return result;

  } catch (error) {
    console.error(`[OpenAI Vision] Analysis failed (attempt ${retryCount + 1}):`, error);
    
    // Retry logic with exponential backoff
    if (retryCount < maxRetries) {
      const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
      console.log(`⏳ Retrying in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return analyzeImagesForGuidelines(imageUrls, locale, brandContext, retryCount + 1, maxRetries);
    }
    
    throw error;
  }
}

/**
 * Generate test images based on visual guidelines using Google Gemini
 */
export async function generateTestImages(
  basePrompt: string,
  negativePrompt?: string,
  count: number = 1
): Promise<Array<{ url: string; storage_path: string }>> {
  try {
    // Lazy import Gemini to avoid initialization errors if API key is missing
    const { generateImagesWithGemini } = await import('../gemini/client.js');
    
    // Combine base prompt with negative prompt instructions
    let fullPrompt = basePrompt;
    
    if (negativePrompt) {
      fullPrompt += `\n\nAvoid: ${negativePrompt}`;
    }

    console.log('🎨 Generating images with Gemini Nano Banana...');
    
    // Use Gemini instead of DALL-E
    const images = await generateImagesWithGemini(fullPrompt, count);

    console.log(`✅ Generated ${images.length} images successfully`);
    return images;

  } catch (error) {
    console.error('[Image Generation] Failed:', error);
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

  // Convert locale code to language name
  const languageMap: Record<string, string> = {
    'en-US': 'English (US)',
    'en-GB': 'English (UK)',
    'pt-BR': 'Portuguese (Brazilian)',
    'pt-PT': 'Portuguese (European)'
  };
  
  const language = languageMap[locale] || 'English (US)';

  return `${contextSection}Analyze these brand images and create a comprehensive Visual Brand Guideline document.

IMPORTANT: Output ALL text content in ${language}. Every description, guideline, and note must be written in ${language}.

Your task is to extract and define:
1. General visual principles that define this brand's visual identity
2. Specific style direction (lighting, color, composition, format)
3. Color palette with hex codes (primary, secondary, neutrals)
4. Guidelines for people and emotions in imagery
5. Different types/categories of images - BE SPECIFIC about WHAT is shown (subjects, activities, roles) and WHERE (context, setting, environment)
6. Psychological triggers (neuro-marketing elements)
7. Variation and consistency rules
8. Detailed prompting guidance for AI image generation - include specific subjects and contexts
9. Producer notes (camera, lighting, angle, scene setup)

CRITICAL: When analyzing the images, identify:
- WHO is in the images (their roles: therapist, client, professional, customer, etc.)
- WHAT they are doing (therapy session, consultation, meeting, etc.)
- WHERE this is happening (therapy office, conference room, home, studio, etc.)
- The RELATIONSHIP between people (professional/client, colleagues, friends, etc.)

Format your response as structured JSON:
{
  "general_principles": [
    "Principle 1 about overall visual style",
    "Principle 2 about authenticity and approach",
    "Principle 3 about what to emphasize"
  ],
  "style_direction": {
    "lighting": "Detailed lighting description (e.g., natural daylight, soft studio lighting)",
    "colour": "Color approach and saturation style",
    "composition": "Framing and composition rules",
    "format": "Image format and ratio recommendations"
  },
  "palette": {
    "primary": ["#hex1", "#hex2"],
    "secondary": ["#hex3", "#hex4"],
    "neutrals": ["#hex5", "#hex6"]
  },
  "people_and_emotions": [
    "Guidelines for depicting people",
    "Emotional tones to convey",
    "Situations and contexts to show"
  ],
  "types_of_images": [
    {
      "category_name": "Category 1 (e.g., 'Therapy Sessions', 'Business Meetings', 'Product Photography')",
      "subject_matter": "What is shown: people, objects, activities (e.g., 'Therapist with client', 'Team collaboration', 'Product on desk')",
      "context": "Where and what's happening (e.g., 'Professional therapy office', 'Modern conference room', 'Minimalist studio')",
      "examples": [
        "Detailed scenario 1 with WHO, WHAT, WHERE",
        "Detailed scenario 2 with WHO, WHAT, WHERE"
      ]
    },
    {
      "category_name": "Category 2",
      "subject_matter": "What is shown",
      "context": "Where and what's happening",
      "examples": [
        "Detailed scenario 1",
        "Detailed scenario 2"
      ]
    }
  ],
  "neuro_triggers": [
    "Psychological trigger 1 (e.g., curiosity, belonging)",
    "How to achieve this trigger visually"
  ],
  "variation_rules": [
    "Rule for maintaining variety",
    "Rule for consistency",
    "What to rotate/avoid repeating"
  ],
  "prompting_guidance": [
    "Always include: [key elements for AI prompts]",
    "Recommended keywords and modifiers",
    "Strict avoidances for AI generation"
  ],
  "producer_notes": {
    "camera": "Camera type, lens, settings recommendations (e.g., 'iPhone 15 Pro, portrait mode, natural focus')",
    "lighting": "Lighting setup and direction (e.g., 'Golden hour natural light from window, soft diffused')",
    "angle": "Camera angle and perspective (e.g., 'Eye level, slightly off-center, human perspective')",
    "scene": "Scene composition and staging (e.g., 'Real workspace environment, minimal staging, authentic clutter')"
  }
}

Be specific, detailed, and actionable. Think like a brand photographer creating a shooting guide.`;
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
      general_principles: parsedData.general_principles || [
        'Maintain consistent visual identity across all brand materials',
        'Focus on authenticity and genuine representation',
        'Emphasize clarity and professional presentation'
      ],
      style_direction: {
        lighting: parsedData.style_direction?.lighting || 'Natural, soft lighting with balanced exposure',
        colour: parsedData.style_direction?.colour || 'Natural tones with brand color accents',
        composition: parsedData.style_direction?.composition || 'Clean, balanced framing with clear focal points',
        format: parsedData.style_direction?.format || 'Square and landscape formats for versatility'
      },
      palette: {
        primary: parsedData.palette?.primary || ['#000000'],
        secondary: parsedData.palette?.secondary || ['#ffffff'],
        neutrals: parsedData.palette?.neutrals || ['#f0f0f0'],
      },
      people_and_emotions: parsedData.people_and_emotions || [
        'Authentic, diverse representation',
        'Natural expressions and genuine emotions',
        'Relatable, everyday contexts and situations'
      ],
      types_of_images: parsedData.types_of_images || [
        {
          category_name: 'Brand Photography',
          examples: [
            'Professional workspace environments',
            'Product showcases with context',
            'Team collaboration moments'
          ]
        }
      ],
      neuro_triggers: parsedData.neuro_triggers || [
        'Curiosity: Visual hints that encourage deeper engagement',
        'Belonging: Relatable scenarios and inclusive representation',
        'Authenticity: Real moments and genuine interactions'
      ],
      variation_rules: parsedData.variation_rules || [
        'Rotate between different image types to maintain visual interest',
        'Maintain consistent style across all variations',
        'Avoid repetitive compositions or subjects'
      ],
      prompting_guidance: parsedData.prompting_guidance || [
        'Always specify: professional photography, natural lighting, authentic moment',
        'Include brand context and emotional tone',
        'Avoid: artificial, staged, or overly processed aesthetics'
      ],
      producer_notes: {
        camera: parsedData.producer_notes?.camera || 'Professional camera or high-end smartphone, natural focus',
        lighting: parsedData.producer_notes?.lighting || 'Soft natural light, avoid harsh shadows',
        angle: parsedData.producer_notes?.angle || 'Eye-level perspective, human viewpoint',
        scene: parsedData.producer_notes?.scene || 'Authentic environment, minimal staging'
      }
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
 * Generate comprehensive markdown summary of visual guidelines
 */
function generateMarkdownSummary(guide: VisualGuideRules, locale: string): string {
  // Translation map for markdown headings
  const headings: Record<string, Record<string, string>> = {
    'en-US': {
      title: 'Visual Brand Guidelines',
      generalPrinciples: 'General Principles',
      styleDirection: 'Style Direction',
      lighting: 'Lighting',
      colorApproach: 'Color Approach',
      composition: 'Composition',
      format: 'Format',
      colorPalette: 'Color Palette',
      primaryColors: 'Primary Colors',
      secondaryColors: 'Secondary Colors',
      neutralColors: 'Neutral Colors',
      peopleEmotions: 'People and Emotions',
      typesOfImages: 'Types of Images',
      neuroTriggers: 'Neuro-Marketing Triggers',
      variationRules: 'Variation Rules',
      promptingGuidance: 'Prompting Guidance for AI Image Generation',
      producerNotes: 'Producer Notes',
      cameraSetup: 'Camera Setup',
      lightingSetup: 'Lighting Setup',
      cameraAngle: 'Camera Angle',
      sceneDirection: 'Scene Direction'
    },
    'en-GB': {
      title: 'Visual Brand Guidelines',
      generalPrinciples: 'General Principles',
      styleDirection: 'Style Direction',
      lighting: 'Lighting',
      colorApproach: 'Colour Approach',
      composition: 'Composition',
      format: 'Format',
      colorPalette: 'Colour Palette',
      primaryColors: 'Primary Colours',
      secondaryColors: 'Secondary Colours',
      neutralColors: 'Neutral Colours',
      peopleEmotions: 'People and Emotions',
      typesOfImages: 'Types of Images',
      neuroTriggers: 'Neuro-Marketing Triggers',
      variationRules: 'Variation Rules',
      promptingGuidance: 'Prompting Guidance for AI Image Generation',
      producerNotes: 'Producer Notes',
      cameraSetup: 'Camera Setup',
      lightingSetup: 'Lighting Setup',
      cameraAngle: 'Camera Angle',
      sceneDirection: 'Scene Direction'
    },
    'pt-BR': {
      title: 'Diretrizes Visuais da Marca',
      generalPrinciples: 'Princípios Gerais',
      styleDirection: 'Direção de Estilo',
      lighting: 'Iluminação',
      colorApproach: 'Abordagem de Cor',
      composition: 'Composição',
      format: 'Formato',
      colorPalette: 'Paleta de Cores',
      primaryColors: 'Cores Primárias',
      secondaryColors: 'Cores Secundárias',
      neutralColors: 'Cores Neutras',
      peopleEmotions: 'Pessoas e Emoções',
      typesOfImages: 'Tipos de Imagens',
      neuroTriggers: 'Gatilhos de Neuromarketing',
      variationRules: 'Regras de Variação',
      promptingGuidance: 'Orientação para Prompts de Geração de Imagens IA',
      producerNotes: 'Notas de Produção',
      cameraSetup: 'Configuração de Câmera',
      lightingSetup: 'Configuração de Iluminação',
      cameraAngle: 'Ângulo de Câmera',
      sceneDirection: 'Direção de Cena'
    },
    'pt-PT': {
      title: 'Diretrizes Visuais da Marca',
      generalPrinciples: 'Princípios Gerais',
      styleDirection: 'Direção de Estilo',
      lighting: 'Iluminação',
      colorApproach: 'Abordagem de Cor',
      composition: 'Composição',
      format: 'Formato',
      colorPalette: 'Paleta de Cores',
      primaryColors: 'Cores Primárias',
      secondaryColors: 'Cores Secundárias',
      neutralColors: 'Cores Neutras',
      peopleEmotions: 'Pessoas e Emoções',
      typesOfImages: 'Tipos de Imagens',
      neuroTriggers: 'Gatilhos Neuromarketing',
      variationRules: 'Regras de Variação',
      promptingGuidance: 'Orientação para Prompts de Geração de Imagens IA',
      producerNotes: 'Notas de Produção',
      cameraSetup: 'Configuração de Câmara',
      lightingSetup: 'Configuração de Iluminação',
      cameraAngle: 'Ângulo de Câmara',
      sceneDirection: 'Direção de Cena'
    }
  };

  const h = headings[locale] || headings['en-US'];

  return `# ${h.title}

## ${h.generalPrinciples}
${guide.general_principles.map(principle => `- ${principle}`).join('\n')}

## ${h.styleDirection}

### ${h.lighting}
${guide.style_direction.lighting}

### ${h.colorApproach}
${guide.style_direction.colour}

### ${h.composition}
${guide.style_direction.composition}

### ${h.format}
${guide.style_direction.format}

## ${h.colorPalette}
- **${h.primaryColors}:** ${guide.palette.primary.join(', ')}
- **${h.secondaryColors}:** ${guide.palette.secondary.join(', ')}
- **${h.neutralColors}:** ${guide.palette.neutrals.join(', ')}

## ${h.peopleEmotions}
${guide.people_and_emotions.map(item => `- ${item}`).join('\n')}

## ${h.typesOfImages}
${guide.types_of_images.map(category => `
### ${category.category_name}
${category.examples.map(example => `- ${example}`).join('\n')}
`).join('\n')}

## ${h.neuroTriggers}
${guide.neuro_triggers.map(trigger => `- ${trigger}`).join('\n')}

## ${h.variationRules}
${guide.variation_rules.map(rule => `- ${rule}`).join('\n')}

## ${h.promptingGuidance}
${guide.prompting_guidance.map(guidance => `- ${guidance}`).join('\n')}

## ${h.producerNotes}

### ${h.cameraSetup}
${guide.producer_notes.camera}

### ${h.lightingSetup}
${guide.producer_notes.lighting}

### ${h.cameraAngle}
${guide.producer_notes.angle}

### ${h.sceneDirection}
${guide.producer_notes.scene}
`;
}

