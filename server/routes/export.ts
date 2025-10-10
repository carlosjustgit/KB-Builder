import { Router } from 'express';
import { exportService } from '../services/export/index.js';
import { authenticateRequest } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { validateRequest } from '../middleware/validation.js';
import { z } from 'zod';

const router = Router();

// Apply rate limiting to all export routes
router.use(rateLimiter);

// Validation schemas
const exportRequestSchema = z.object({
  sessionId: z.string().uuid(),
  options: z.object({
    includeImages: z.boolean().default(true),
    includeSources: z.boolean().default(true),
    includeVisualGuide: z.boolean().default(true),
    format: z.enum(['json', 'zip']).default('json'),
  }),
});

const exportStatsSchema = z.object({
  sessionId: z.string().uuid(),
});

/**
 * POST /api/export/generate
 * Generate a new export for a session
 */
router.post('/generate', authenticateRequest, validateRequest(exportRequestSchema), async (req, res) => {
  try {
    const { sessionId, options } = req.body;

    console.log(`[Export API] Generating ${options.format} export for session ${sessionId}`);

    let filepath: string;
    
    if (options.format === 'json') {
      filepath = await exportService.generateJSONExport(sessionId, options);
    } else {
      filepath = await exportService.generateZIPExport(sessionId, options);
    }

    // Return the file for download
    res.download(filepath, (err) => {
      if (err) {
        console.error(`[Export API] Download error:`, err);
        if (!res.headersSent) {
          res.status(500).json({ 
            error: 'Failed to download export file',
            code: 'DOWNLOAD_ERROR'
          });
        }
      } else {
        console.log(`[Export API] Export downloaded successfully: ${filepath}`);
      }
    });

  } catch (error) {
    console.error(`[Export API] Export generation failed:`, error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = errorMessage.includes('not found') ? 404 : 500;
    
    res.status(statusCode).json({
      error: errorMessage,
      code: statusCode === 404 ? 'SESSION_NOT_FOUND' : 'EXPORT_ERROR'
    });
  }
});

/**
 * GET /api/export/stats/:sessionId
 * Get export statistics for a session
 */
router.get('/stats/:sessionId', authenticateRequest, validateRequest(exportStatsSchema, 'params'), async (req, res) => {
  try {
    const { sessionId } = req.params;

    console.log(`[Export API] Fetching export stats for session ${sessionId}`);

    const stats = await exportService.getExportStats(sessionId);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error(`[Export API] Failed to fetch export stats:`, error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    res.status(500).json({
      error: errorMessage,
      code: 'STATS_ERROR'
    });
  }
});

/**
 * GET /api/export/download/:filename
 * Download a previously generated export file
 */
router.get('/download/:filename', authenticateRequest, async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Validate filename format (basic security check)
    if (!filename.match(/^kb-export-[a-f0-9-]+-\d+\.(json|zip)$/)) {
      return res.status(400).json({
        error: 'Invalid filename format',
        code: 'INVALID_FILENAME'
      });
    }

    console.log(`[Export API] Downloading export file: ${filename}`);

    const filepath = `${process.cwd()}/exports/${filename}`;
    
    res.download(filepath, (err) => {
      if (err) {
        console.error(`[Export API] Download error:`, err);
        if (!res.headersSent) {
          res.status(404).json({ 
            error: 'Export file not found',
            code: 'FILE_NOT_FOUND'
          });
        }
      } else {
        console.log(`[Export API] Export downloaded successfully: ${filename}`);
      }
    });

  } catch (error) {
    console.error(`[Export API] Download failed:`, error);
    
    res.status(500).json({
      error: 'Failed to download export file',
      code: 'DOWNLOAD_ERROR'
    });
  }
});

/**
 * GET /api/export/pdf/:sessionId/:documentId
 * Generate and download PDF for a specific document
 */
router.get('/pdf/:sessionId/:documentId', authenticateRequest, async (req, res) => {
  try {
    const { sessionId, documentId } = req.params;

    console.log(`[Export API] Generating PDF for document ${documentId} in session ${sessionId}`);

    const filepath = await exportService.generatePDFExport(sessionId, documentId);

    // Return the file for download
    res.download(filepath, (err) => {
      if (err) {
        console.error(`[Export API] PDF download error:`, err);
        if (!res.headersSent) {
          res.status(500).json({ 
            error: 'Failed to download PDF file',
            code: 'DOWNLOAD_ERROR'
          });
        }
      } else {
        console.log(`[Export API] PDF downloaded successfully: ${filepath}`);
      }
    });

  } catch (error) {
    console.error(`[Export API] PDF generation failed:`, error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = errorMessage.includes('not found') ? 404 : 500;
    
    res.status(statusCode).json({
      error: errorMessage,
      code: statusCode === 404 ? 'DOCUMENT_NOT_FOUND' : 'PDF_ERROR'
    });
  }
});

/**
 * GET /api/export/list/:sessionId
 * List all exports for a session
 */
router.get('/list/:sessionId', authenticateRequest, validateRequest(exportStatsSchema, 'params'), async (req, res) => {
  try {
    const { sessionId } = req.params;

    console.log(`[Export API] Listing exports for session ${sessionId}`);

    const stats = await exportService.getExportStats(sessionId);

    res.json({
      success: true,
      data: {
        sessionId,
        ...stats,
        exports: stats.latest_export ? [stats.latest_export] : []
      }
    });

  } catch (error) {
    console.error(`[Export API] Failed to list exports:`, error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    res.status(500).json({
      error: errorMessage,
      code: 'LIST_ERROR'
    });
  }
});

export default router;