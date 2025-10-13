import type { VercelRequest, VercelResponse } from '@vercel/node';
import JSZip from 'jszip';
import { supabase } from '../../server/services/supabase/client.js';

interface ExportOptions {
  includeImages: boolean;
  includeSources: boolean;
  includeVisualGuide: boolean;
  format: 'json' | 'zip';
}

/**
 * POST /api/export/generate
 * Generate a new export for a session (JSON or ZIP)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
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
    const { sessionId, options } = req.body as {
      sessionId: string;
      options: ExportOptions;
    };

    if (!sessionId) {
      return res.status(400).json({
        error: 'Session ID is required',
      });
    }

    console.log(`📦 [Export] Generating ${options.format} export for session ${sessionId}`);

    // Fetch session data
    const { data: session, error: sessionError } = await supabase
      .from('kb_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({
        error: `Session not found: ${sessionId}`,
        code: 'SESSION_NOT_FOUND'
      });
    }

    // Fetch documents
    const { data: documents, error: docsError } = await supabase
      .from('kb_documents')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (docsError) {
      throw new Error(`Failed to fetch documents: ${docsError.message}`);
    }

    // Fetch images (if requested)
    let images: any[] = [];
    if (options.includeImages) {
      const { data: imagesData, error: imagesError } = await supabase
        .from('kb_images')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (imagesError) {
        console.warn('[Export] Failed to fetch images:', imagesError);
      } else {
        images = imagesData || [];
      }
    }

    // Fetch visual guide (if requested)
    let visualGuide: any = undefined;
    if (options.includeVisualGuide) {
      const { data: guideData, error: guideError } = await supabase
        .from('kb_visual_guides')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (guideError && guideError.code !== 'PGRST116') {
        console.warn('[Export] Failed to fetch visual guide:', guideError);
      } else {
        visualGuide = guideData || undefined;
      }
    }

    // Fetch sources (if requested)
    let sources: any[] = [];
    if (options.includeSources) {
      const { data: sourcesData, error: sourcesError } = await supabase
        .from('kb_sources')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (sourcesError) {
        console.warn('[Export] Failed to fetch sources:', sourcesError);
      } else {
        sources = sourcesData || [];
      }
    }

    const exportData = {
      session,
      documents: documents || [],
      images,
      visualGuide,
      sources,
      metadata: {
        exported_at: new Date().toISOString(),
        version: '1.0.0',
        total_documents: documents?.length || 0,
        total_images: images.length,
        total_sources: sources.length,
      },
    };

    if (options.format === 'json') {
      // Generate JSON export
      const filename = `kb-export-${sessionId}-${Date.now()}.json`;
      const jsonContent = JSON.stringify(exportData, null, 2);

      // Save export record to database
      await supabase.from('kb_exports').insert({
        session_id: sessionId,
        file_type: 'json',
        storage_path: filename,
        created_at: new Date().toISOString(),
      });

      // Set response headers for JSON download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', Buffer.byteLength(jsonContent).toString());

      console.log('✅ [Export] JSON export generated successfully');
      return res.send(jsonContent);

    } else {
      // Generate ZIP export
      const zip = new JSZip();

      // Add main export data as JSON
      zip.file('knowledge-base.json', JSON.stringify(exportData, null, 2));

      // Add individual document files
      const docsFolder = zip.folder('documents');
      if (docsFolder) {
        for (const doc of exportData.documents) {
          const filename = `${doc.doc_type}-${doc.id}.md`;
          docsFolder.file(filename, doc.content_md || '');
        }
      }

      // Add images if requested
      if (options.includeImages && exportData.images.length > 0) {
        const imagesFolder = zip.folder('images');
        if (imagesFolder) {
          for (const image of exportData.images) {
            try {
              // Download image from Supabase storage
              const { data: imageData, error } = await supabase.storage
                .from('kb-builder')
                .download(image.file_path);

              if (!error && imageData) {
                const arrayBuffer = await imageData.arrayBuffer();
                const filename = image.file_path.split('/').pop() || `image-${image.id}`;
                imagesFolder.file(filename, arrayBuffer);
              }
            } catch (error) {
              console.warn(`[Export] Failed to include image ${image.id}:`, error);
            }
          }
        }
      }

      // Add sources if requested
      if (options.includeSources && exportData.sources.length > 0) {
        const sourcesFolder = zip.folder('sources');
        if (sourcesFolder) {
          const sourcesJson = JSON.stringify(exportData.sources, null, 2);
          sourcesFolder.file('sources.json', sourcesJson);
        }
      }

      // Add visual guide if available
      if (exportData.visualGuide) {
        const visualFolder = zip.folder('visual-guide');
        if (visualFolder) {
          visualFolder.file('visual-guide.json', JSON.stringify(exportData.visualGuide, null, 2));
        }
      }

      // Add README
      const readme = `# Knowledge Base Export

## Overview
This export contains the complete knowledge base generated for session **${exportData.session.id.slice(0, 8)}...**.

## Export Information
- **Exported At:** ${new Date(exportData.metadata.exported_at).toLocaleString()}
- **Version:** ${exportData.metadata.version}
- **Session ID:** ${exportData.session.id}

## Contents
- **Documents:** ${exportData.metadata.total_documents} files
- **Images:** ${exportData.metadata.total_images} files
- **Sources:** ${exportData.metadata.total_sources} references

---
Generated by KB Builder`;

      zip.file('README.md', readme);

      // Generate ZIP file
      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      const filename = `kb-export-${sessionId}-${Date.now()}.zip`;

      // Save export record to database
      await supabase.from('kb_exports').insert({
        session_id: sessionId,
        file_type: 'zip',
        storage_path: filename,
        created_at: new Date().toISOString(),
      });

      // Set response headers for ZIP download
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', zipBuffer.length.toString());

      console.log('✅ [Export] ZIP export generated successfully');
      return res.send(zipBuffer);
    }

  } catch (error) {
    console.error('❌ [Export] Generation failed:', error);

    if (error instanceof Error) {
      return res.status(500).json({
        error: 'Failed to generate export',
        message: error.message,
        code: 'EXPORT_ERROR'
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      code: 'EXPORT_ERROR'
    });
  }
}

