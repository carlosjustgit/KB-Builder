import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useExportWithState, useDownloadPDF } from '@/hooks/useExport';
import { useDocuments } from '@/hooks/useDocuments';
import { 
  Download, 
  FileText, 
  Archive,
  Loader2,
  Calendar,
  File,
  FileDown,
  CheckCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export interface ExportProps {
  sessionId: string;
  className?: string;
}

export function Export({ sessionId, className }: ExportProps) {
  const { t } = useTranslation('step-export');
  
  const {
    downloadExport,
    isDownloading,
    stats,
    isLoading,
    error
  } = useExportWithState(sessionId);

  const { data: documents } = useDocuments(sessionId);
  const downloadPDF = useDownloadPDF();

  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);

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
        {/* Next Steps Card */}
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="space-y-4 pb-4">
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-pulse">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center font-bold text-green-700">
              {t('nextSteps.congratulations')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-2">
            {/* Instructions */}
            <div className="space-y-4 text-center">
              <div className="flex items-start gap-3 text-left bg-white/50 p-4 rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-700 font-bold text-lg">1</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{t('nextSteps.step1.title')}</p>
                  <p className="text-sm text-gray-600 mt-1">{t('nextSteps.step1.description')}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-left bg-white/50 p-4 rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-700 font-bold text-lg">2</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{t('nextSteps.step2.title')}</p>
                  <p className="text-sm text-gray-600 mt-1">{t('nextSteps.step2.description')}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-left bg-white/50 p-4 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{t('nextSteps.step3.title')}</p>
                  <p className="text-sm text-gray-600 mt-1">{t('nextSteps.step3.description')}</p>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* CTA Button */}
            <div className="space-y-3">
              <Button
                onClick={() => window.open('https://app.witfy.social', '_blank')}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-6"
                size="lg"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                {t('nextSteps.ctaButton')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <p className="text-xs text-center text-gray-500">
                {t('nextSteps.ctaHint')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* PDF Export Section - Now in top row! */}
        {documents && documents.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileDown className="w-5 h-5 text-purple-600" />
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
                      <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                    ) : (
                      <Download className="w-5 h-5 text-purple-600" />
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
                <FileDown className="w-5 h-5 text-purple-600" />
                {t('pdf.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileDown className="w-12 h-12 text-purple-200 mx-auto mb-4" />
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
