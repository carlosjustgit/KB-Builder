import type { VercelRequest, VercelResponse } from '@vercel/node';
import { OpenAI } from 'openai';
import { supabase } from '../../server/services/supabase/client.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/vision/test-image
 * Generate test images using DALL-E based on visual guidelines
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
    const { base_prompt, negative_prompt, count = 2, session_id } = req.body;

    if (!base_prompt || !session_id) {
      return res.status(400).json({ 
        error: 'Missing required fields: base_prompt and session_id are required' 
      });
    }

    console.log('🎨 [Test Image] Generating test images...');
    console.log('📝 Base prompt:', base_prompt.substring(0, 100) + '...');
    console.log('🔢 Count:', count);

    // Generate images using DALL-E
    const imagePromises = [];
    for (let i = 0; i < count; i++) {
      imagePromises.push(
        openai.images.generate({
          model: 'dall-e-3',
          prompt: base_prompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
          response_format: 'url',
        })
      );
    }

    const imageResults = await Promise.allSettled(imagePromises);
    const successfulImages = imageResults
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value.data[0]);

    if (successfulImages.length === 0) {
      throw new Error('Failed to generate any images');
    }

    console.log(`✅ [Test Image] Generated ${successfulImages.length} images`);

    // Upload images to Supabase storage
    const uploadedImages = [];
    for (let i = 0; i < successfulImages.length; i++) {
      const imageUrl = successfulImages[i].url;
      
      // Download the image
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      
      // Upload to Supabase
      const fileName = `test-${session_id}-${Date.now()}-${i}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('kb-builder')
        .upload(`${session_id}/${fileName}`, imageBuffer, {
          contentType: 'image/png',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        continue;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('kb-builder')
        .getPublicUrl(`${session_id}/${fileName}`);

      uploadedImages.push({
        url: publicUrl,
        storage_path: uploadData.path,
      });
    }

    console.log(`✅ [Test Image] Uploaded ${uploadedImages.length} images to storage`);

    return res.status(200).json({
      success: true,
      images: uploadedImages,
      count: uploadedImages.length,
    });

  } catch (error) {
    console.error('❌ [Test Image] Error:', error);

    if (error instanceof Error) {
      return res.status(500).json({
        error: 'Image generation failed',
        message: error.message,
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}

