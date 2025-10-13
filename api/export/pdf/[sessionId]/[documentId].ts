import type { VercelRequest, VercelResponse } from '@vercel/node';
import { jsPDF } from 'jspdf';
import { supabase } from '../../../../server/services/supabase/client.js';

/**
 * Convert markdown to plain text (simple implementation)
 */
function markdownToPlainText(markdown: string): string {
  return markdown
    // Remove headers but keep the text
    .replace(/^#{1,6}\s+(.+)$/gm, '$1\n')
    // Remove bold/italic
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    // Remove links but keep text
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    // Remove inline code
    .replace(/`(.+?)`/g, '$1')
    // Remove list markers
    .replace(/^[-*+]\s+/gm, '• ')
    .replace(/^\d+\.\s+/gm, '')
    // Clean up extra newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * GET /api/export/pdf/:sessionId/:documentId
 * Generate and download PDF for a specific document
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId, documentId } = req.query;

    if (!sessionId || !documentId) {
      return res.status(400).json({
        error: 'Session ID and Document ID are required',
      });
    }

    console.log(`📄 [Export] Generating PDF for document ${documentId}`);

    // Fetch the document
    const { data: document, error } = await supabase
      .from('kb_documents')
      .select('*')
      .eq('id', documentId)
      .eq('session_id', sessionId)
      .single();

    if (error || !document) {
      console.error('❌ [Export] Document not found:', error);
      return res.status(404).json({
        error: `Document not found: ${documentId}`,
        code: 'DOCUMENT_NOT_FOUND'
      });
    }

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Set font and size
    pdf.setFont('helvetica');
    pdf.setFontSize(12);

    // Add title
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text(document.title || `${document.doc_type.toUpperCase()} Document`, 20, 20);

    // Add metadata
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
    pdf.text(`Type: ${document.doc_type}`, 20, 35);

    // Reset color and add content
    pdf.setTextColor(0);
    pdf.setFontSize(11);
    
    // Convert markdown to plain text (remove markdown syntax)
    const plainText = markdownToPlainText(document.content_md || '');
    
    // Split text into lines that fit the page width
    const pageWidth = 170; // A4 width minus margins
    const lines = pdf.splitTextToSize(plainText, pageWidth);
    
    // Add text with pagination
    let y = 45;
    const lineHeight = 7;
    const pageHeight = 280; // A4 height minus margins
    
    for (const line of lines) {
      if (y + lineHeight > pageHeight) {
        pdf.addPage();
        y = 20;
      }
      pdf.text(line, 20, y);
      y += lineHeight;
    }

    // Add footer on all pages
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.text(
        `Page ${i} of ${pageCount}`,
        pdf.internal.pageSize.getWidth() / 2,
        pdf.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
    
    // Set response headers for PDF download
    const filename = `${document.doc_type}-${document.id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length.toString());

    console.log('✅ [Export] PDF generated successfully');
    return res.send(pdfBuffer);

  } catch (error) {
    console.error('❌ [Export] PDF generation failed:', error);

    if (error instanceof Error) {
      return res.status(500).json({
        error: 'Failed to generate PDF',
        message: error.message,
        code: 'PDF_ERROR'
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      code: 'PDF_ERROR'
    });
  }
}

