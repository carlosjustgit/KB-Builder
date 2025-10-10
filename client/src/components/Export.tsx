import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useExportWithState, useDownloadPDF } from '@/hooks/useExport';
import { useDocuments } from '@/hooks/useDocuments';
import { 
  Download, 
  FileText, 
  Archive, 
  Image, 
  Link, 
  Palette,
  Loader2,
  Calendar,
  File,
  FileDown
} from 'lucide-react';

export interface ExportProps {
  sessionId: string;
  className?: string;
}

export function Export({ sessionId, className }: ExportProps) {
  const { t } = useTranslation('step-export');
  
  const {
    generateExport,
    downloadExport,
    isGenerating,
    isDownloading,
    stats,
    isLoading,
    error
  } = useExportWithState(sessionId);

  const { data: documents } = useDocuments(sessionId);
  const downloadPDF = useDownloadPDF();

  const [exportOptions, setExportOptions] = useState({
    includeImages: true,
    includeSources: true,
    includeVisualGuide: true,
    format: 'zip' as 'json' | 'zip',
  });

  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);

  const handleGenerateExport = () => {
    generateExport({
      sessionId,
      options: exportOptions,
    });
  };

  const handleDownloadExisting = (filename: string) => {
    downloadExport(filename);
  };

  const handleDownloadPDF = async (documentId: string, docType: string) => {
    setDownloadingDocId(documentId);
    try {
      await downloadPDF.mutateAsync({ sessionId, documentId, docType });
    } finally {
      setDownloadingDocId(null);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>{t('loading.exportInfo')}</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <p>{t('error.loadFailed')}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Top Row: Generate Export + PDF Export */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Export Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              {t('generate.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Format Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">{t('generate.formatLabel')}</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={exportOptions.format === 'json' ? 'default' : 'outline'}
                  onClick={() => setExportOptions(prev => ({ ...prev, format: 'json' }))}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  <span>{t('generate.formatJson')}</span>
                  <span className="text-xs text-muted-foreground">{t('generate.formatJsonDesc')}</span>
                </Button>
                <Button
                  variant={exportOptions.format === 'zip' ? 'default' : 'outline'}
                  onClick={() => setExportOptions(prev => ({ ...prev, format: 'zip' }))}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                >
                  <Archive className="w-5 h-5" />
                  <span>{t('generate.formatZip')}</span>
                  <span className="text-xs text-muted-foreground">{t('generate.formatZipDesc')}</span>
                </Button>
              </div>
            </div>

            <Separator />

            {/* Include Options */}
            <div className="space-y-4">
              <Label className="text-base font-medium">{t('generate.includeLabel')}</Label>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="includeImages"
                    checked={exportOptions.includeImages}
                    onCheckedChange={(checked) => 
                      setExportOptions(prev => ({ ...prev, includeImages: !!checked }))
                    }
                  />
                  <Label htmlFor="includeImages" className="flex items-center gap-2 cursor-pointer">
                    <Image className="w-4 h-4" />
                    {t('generate.includeImages', { count: stats?.total_images || 0 })}
                  </Label>
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="includeSources"
                    checked={exportOptions.includeSources}
                    onCheckedChange={(checked) => 
                      setExportOptions(prev => ({ ...prev, includeSources: !!checked }))
                    }
                  />
                  <Label htmlFor="includeSources" className="flex items-center gap-2 cursor-pointer">
                    <Link className="w-4 h-4" />
                    {t('generate.includeSources', { count: stats?.total_sources || 0 })}
                  </Label>
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="includeVisualGuide"
                    checked={exportOptions.includeVisualGuide}
                    onCheckedChange={(checked) => 
                      setExportOptions(prev => ({ ...prev, includeVisualGuide: !!checked }))
                    }
                  />
                  <Label htmlFor="includeVisualGuide" className="flex items-center gap-2 cursor-pointer">
                    <Palette className="w-4 h-4" />
                    {t('generate.includeVisualGuide')}
                  </Label>
                </div>
              </div>
            </div>

            <Separator />

            {/* Generate Button */}
            <Button
              onClick={handleGenerateExport}
              disabled={isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('generate.generating')}
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  {t('generate.generateButton')}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* PDF Export Section - Now in top row! */}
        {documents && documents.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileDown className="w-5 h-5" />
                {t('pdf.title')}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                {t('pdf.description')}
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {documents.map((doc) => (
                  <Button
                    key={doc.id}
                    variant="outline"
                    onClick={() => handleDownloadPDF(doc.id, doc.doc_type)}
                    disabled={downloadingDocId === doc.id}
                    className="h-auto p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4" />
                      <div className="text-left">
                        <div className="font-medium capitalize">{doc.doc_type}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {doc.title || `${doc.doc_type} document`}
                        </div>
                      </div>
                    </div>
                    {downloadingDocId === doc.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileDown className="w-5 h-5" />
                {t('pdf.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t('pdf.noDocuments')}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('pdf.noDocumentsDescription')}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Row: Export History (Full Width) */}
      <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <File className="w-5 h-5" />
              {t('history.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats && stats.total_exports > 0 ? (
              <div className="space-y-4">
                {/* Statistics */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">{stats.total_exports}</div>
                    <div className="text-sm text-muted-foreground">{t('history.totalExports')}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">{stats.json_exports}</div>
                    <div className="text-sm text-muted-foreground">{t('history.jsonFiles')}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">{stats.zip_exports}</div>
                    <div className="text-sm text-muted-foreground">{t('history.zipFiles')}</div>
                  </div>
                </div>

                <Separator />

                {/* Latest Export */}
                {stats.latest_export && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">{t('history.latestExport')}</Label>
                    <div className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {stats.latest_export.file_type === 'zip' ? (
                            <Archive className="w-4 h-4 text-blue-600" />
                          ) : (
                            <FileText className="w-4 h-4 text-green-600" />
                          )}
                          <span className="font-medium">
                            {t('history.exportType', { type: stats.latest_export.file_type.toUpperCase() })}
                          </span>
                        </div>
                        <Badge variant="secondary">
                          {stats.latest_export.file_type}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(stats.latest_export.created_at)}
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadExisting(stats.latest_export!.storage_path)}
                        disabled={isDownloading}
                        className="w-full"
                      >
                        {isDownloading ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                            {t('history.downloading')}
                          </>
                        ) : (
                          <>
                            <Download className="w-3 h-3 mr-2" />
                            {t('history.downloadAgain')}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <File className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t('history.noExports')}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('history.noExportsDescription')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
