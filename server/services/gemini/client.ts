import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not set in environment variables');
}

const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Generate images using Gemini Nano Banana model
 */
export async function generateImagesWithGemini(
  prompt: string,
  count: number = 1
): Promise<Array<{ url: string; storage_path: string }>> {
  try {
    console.log('🍌 Generating images with Gemini Nano Banana...');
    console.log('📝 Prompt:', prompt);
    console.log('🔢 Count:', count);

    // Initialize the Nano Banana model for image generation
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });

    const results: Array<{ url: string; storage_path: string }> = [];

    // Generate images
    for (let i = 0; i < count; i++) {
      console.log(`🎨 Generating image ${i + 1}/${count}...`);

      // Request image generation - the model automatically generates images based on the prompt
      // Do NOT use responseMimeType for image output (only supports text formats)
      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{
            text: `Create a high-quality photograph: ${prompt}`
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      });

      const response = await result.response;
      console.log('✅ Gemini response received');
      console.log('📊 Response structure:', JSON.stringify(response, null, 2));

      // Extract image data from response
      const imageUrl = extractImageUrl(response);

      results.push({
        url: imageUrl,
        storage_path: `generated/gemini-${Date.now()}-${i}.png`,
      });
    }

    console.log(`✅ Generated ${results.length} images with Gemini`);
    return results;

  } catch (error) {
    console.error('[Gemini] Image generation failed:', error);
    throw new Error(
      `Gemini image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Extract image URL from Gemini response
 */
function extractImageUrl(response: any): string {
  console.log('🔍 Extracting image URL from response...');
  
  try {
    // Check if response has candidates with images
    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      console.log('✅ Found candidate');
      
      // Check for inline data in parts
      if (candidate.content?.parts && candidate.content.parts.length > 0) {
        console.log(`📦 Found ${candidate.content.parts.length} parts`);
        
        for (const part of candidate.content.parts) {
          // Check for inline image data (base64)
          if (part.inlineData?.data) {
            const mimeType = part.inlineData.mimeType || 'image/png';
            console.log(`✅ Found inline image data (${mimeType})`);
            return `data:${mimeType};base64,${part.inlineData.data}`;
          }
          
          // Check for file URI
          if (part.fileData?.fileUri) {
            console.log(`✅ Found file URI: ${part.fileData.fileUri}`);
            return part.fileData.fileUri;
          }
          
          // Check for text (might contain image URL)
          if (part.text) {
            console.log(`📝 Found text part: ${part.text.substring(0, 100)}...`);
          }
        }
      }
    }
    
    // Log the full response structure for debugging
    console.error('❌ Could not find image in response structure');
    console.error('📊 Full response:', JSON.stringify(response, null, 2));
    throw new Error('Could not extract image URL from Gemini response');
    
  } catch (error) {
    console.error('❌ Error extracting image URL:', error);
    throw new Error(`Could not extract image URL from Gemini response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

