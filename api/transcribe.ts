import type { VercelRequest, VercelResponse } from '@vercel/node';
import { OpenAI } from 'openai';
import formidable from 'formidable';
import fs from 'fs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * POST /api/transcribe
 * Transcribe audio using OpenAI Whisper API
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🎤 [Transcribe] Starting audio transcription...');

    // Parse multipart form data
    const form = formidable({
      maxFileSize: 25 * 1024 * 1024, // 25MB max
      keepExtensions: true,
    });

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio;
    const language = Array.isArray(fields.language) ? fields.language[0] : fields.language || 'en';

    if (!audioFile) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log(`🎤 [Transcribe] Audio file received: ${audioFile.originalFilename}, size: ${audioFile.size} bytes`);
    console.log(`🌍 [Transcribe] Language: ${language}`);

    // Read the audio file
    const audioBuffer = fs.readFileSync(audioFile.filepath);
    
    // Create a File object for OpenAI
    const file = new File([audioBuffer], audioFile.originalFilename || 'audio.webm', {
      type: audioFile.mimetype || 'audio/webm',
    });

    // Transcribe using OpenAI Whisper
    console.log('🔄 [Transcribe] Sending to OpenAI Whisper...');
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: language === 'pt-BR' || language === 'pt-PT' ? 'pt' : language.split('-')[0],
      response_format: 'text',
    });

    console.log(`✅ [Transcribe] Success: "${transcription.substring(0, 100)}..."`);

    // Clean up temporary file
    fs.unlinkSync(audioFile.filepath);

    return res.status(200).json({
      transcript: transcription,
    });

  } catch (error) {
    console.error('❌ [Transcribe] Error:', error);

    if (error instanceof Error) {
      return res.status(500).json({
        error: 'Transcription failed',
        message: error.message,
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}

