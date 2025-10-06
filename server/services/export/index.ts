import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import JSZip from 'jszip';
import { supabase } from '../supabase/client.js';
import type { KBSession, KBDocument, KBImage, KBVisualGuide, KBSource } from '../../types/index.js';

export interface ExportData {
  session: KBSession;
  documents: KBDocument[];
  images: KBImage[];
  visualGuide?: KBVisualGuide;
  sources: KBSource[];
  metadata: {
    exported_at: string;
    version: string;
    total_documents: number;
    total_images: number;
    total_sources: number;
  };
}

export interface ExportOptions {
  includeImages: boolean;
  includeSources: boolean;
  includeVisualGuide: boolean;
  format: 'json' | 'zip';
}

/**
 * Export service for generating knowledge base exports
 */
export class ExportService {
  private readonly exportDir = join(process.cwd(), 'exports');

  constructor() {
    // Ensure exports directory exists
    mkdirSync(this.exportDir, { recursive: true });
  }

  /**
   * Generate export data for a session
   */
  async generateExportData(sessionId: string, options: ExportOptions): Promise<ExportData> {
    console.log(`[Export] Generating export data for session ${sessionId}`);

    // Fetch session data
    const { data: session, error: sessionError } = await supabase
      .from('kb_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      throw new Error(`Session not found: ${sessionId}`);
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
    let images: KBImage[] = [];
    if (options.includeImages) {
      const { data: imagesData, error: imagesError } = await supabase
        .from('kb_images')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (imagesError) {
        throw new Error(`Failed to fetch images: ${imagesError.message}`);
      }
      images = imagesData || [];
    }

    // Fetch visual guide (if requested)
    let visualGuide: KBVisualGuide | undefined;
    if (options.includeVisualGuide) {
      const { data: guideData, error: guideError } = await supabase
        .from('kb_visual_guides')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (guideError && guideError.code !== 'PGRST116') {
        throw new Error(`Failed to fetch visual guide: ${guideError.message}`);
      }
      visualGuide = guideData || undefined;
    }

    // Fetch sources (if requested)
    let sources: KBSource[] = [];
    if (options.includeSources) {
      const { data: sourcesData, error: sourcesError } = await supabase
        .from('kb_sources')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (sourcesError) {
        throw new Error(`Failed to fetch sources: ${sourcesError.message}`);
      }
      sources = sourcesData || [];
    }

    return {
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
  }

  /**
   * Generate JSON export
   */
  async generateJSONExport(sessionId: string, options: ExportOptions): Promise<string> {
    console.log(`[Export] Generating JSON export for session ${sessionId}`);

    const exportData = await this.generateExportData(sessionId, options);
    const filename = `kb-export-${sessionId}-${Date.now()}.json`;
    const filepath = join(this.exportDir, filename);

    // Write JSON file
    writeFileSync(filepath, JSON.stringify(exportData, null, 2), 'utf8');

    // Save export record to database
    await this.saveExportRecord(sessionId, 'json', filename);

    console.log(`[Export] JSON export saved: ${filepath}`);
    return filepath;
  }

  /**
   * Generate ZIP export with all assets
   */
  async generateZIPExport(sessionId: string, options: ExportOptions): Promise<string> {
    console.log(`[Export] Generating ZIP export for session ${sessionId}`);

    const exportData = await this.generateExportData(sessionId, options);
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
        
        // Generate markdown summary
        const markdownSummary = this.generateVisualGuideMarkdown(exportData.visualGuide);
        visualFolder.file('visual-guide.md', markdownSummary);
      }
    }

    // Add README
    const readme = this.generateReadme(exportData);
    zip.file('README.md', readme);

    // Generate ZIP file
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    const filename = `kb-export-${sessionId}-${Date.now()}.zip`;
    const filepath = join(this.exportDir, filename);

    writeFileSync(filepath, zipBuffer);

    // Save export record to database
    await this.saveExportRecord(sessionId, 'json', filename);

    console.log(`[Export] ZIP export saved: ${filepath}`);
    return filepath;
  }

  /**
   * Save export record to database
   */
  private async saveExportRecord(sessionId: string, fileType: 'json' | 'zip', filename: string): Promise<void> {
    const { error } = await supabase
      .from('kb_exports')
      .insert({
        session_id: sessionId,
        file_type: fileType,
        storage_path: filename,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error(`[Export] Failed to save export record:`, error);
    }
  }

  /**
   * Generate README for ZIP export
   */
  private generateReadme(exportData: ExportData): string {
    return `# Knowledge Base Export

## Overview
This export contains the complete knowledge base generated for **${exportData.session.id.slice(0, 8)}...**.

## Export Information
- **Exported At:** ${new Date(exportData.metadata.exported_at).toLocaleString()}
- **Version:** ${exportData.metadata.version}
- **Session ID:** ${exportData.session.id}

## Contents
- **Documents:** ${exportData.metadata.total_documents} files
- **Images:** ${exportData.metadata.total_images} files
- **Sources:** ${exportData.metadata.total_sources} references

## File Structure
\`\`\`
knowledge-base.json          # Complete export data
documents/                    # Individual document files
├── brand-*.md
├── services-*.md
├── market-*.md
├── competitors-*.md
└── tone-*.md
images/                       # Uploaded images
sources/                      # Research sources
├── sources.json
visual-guide/                 # Visual brand guidelines
├── visual-guide.json
└── visual-guide.md
README.md                     # This file
\`\`\`

## Usage
1. **knowledge-base.json** - Complete structured data
2. **documents/** - Individual markdown files for each document type
3. **images/** - All uploaded images
4. **sources/** - Research sources and references
5. **visual-guide/** - Brand visual guidelines

## Next Steps
- Review the generated content
- Customize the documents as needed
- Use the visual guide for brand consistency
- Reference the sources for additional research

---
Generated by KB Builder
`;
  }

  /**
   * Generate markdown summary of visual guide
   */
  private generateVisualGuideMarkdown(visualGuide: KBVisualGuide): string {
    const rules = visualGuide.rules_json;
    
    return `# Visual Brand Guidelines

## Color Palette
- **Primary Colors:** ${rules.palette?.primary?.join(', ') || 'Not specified'}
- **Secondary Colors:** ${rules.palette?.secondary?.join(', ') || 'Not specified'}

## Typography
- **Primary Font:** Not specified
- **Secondary Font:** Not specified

## Visual Style
- **Style:** Not specified
- **Mood:** Not specified

## Dos and Don'ts
### Do:
${rules.dos?.map((item: string) => `- ${item}`).join('\n') || '- Not specified'}

### Don't:
${rules.donts?.map((item: string) => `- ${item}`).join('\n') || '- Not specified'}

## Base Prompts
${rules.base_prompts?.map((prompt: string) => `- ${prompt}`).join('\n') || '- Not specified'}

## Negative Prompts
${rules.negative_prompts?.map((prompt: string) => `- ${prompt}`).join('\n') || '- Not specified'}

---
Generated on ${new Date().toLocaleString()}
`;
  }

  /**
   * Get export statistics for a session
   */
  async getExportStats(sessionId: string): Promise<{
    total_exports: number;
    json_exports: number;
    zip_exports: number;
    latest_export?: {
      file_type: 'json' | 'zip';
      created_at: string;
      storage_path: string;
    };
  }> {
    const { data: exports, error } = await supabase
      .from('kb_exports')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch export stats: ${error.message}`);
    }

    const stats = {
      total_exports: exports?.length || 0,
      json_exports: exports?.filter(e => e.file_type === 'json').length || 0,
      zip_exports: exports?.filter(e => e.file_type === 'zip').length || 0,
      latest_export: exports?.[0] ? {
        file_type: exports[0].file_type,
        created_at: exports[0].created_at,
        storage_path: exports[0].storage_path,
      } : undefined,
    };

    return stats;
  }
}

// Export singleton instance
export const exportService = new ExportService();
