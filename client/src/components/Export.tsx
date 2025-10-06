import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useExportWithState } from '@/hooks/useExport';
import { 
  Download, 
  FileText, 
  Archive, 
  Image, 
  Link, 
  Palette,
  Loader2,
  Calendar,
  File
} from 'lucide-react';

export interface ExportProps {
  sessionId: string;
  className?: string;
}

export function Export({ sessionId, className }: ExportProps) {
  
  const {
    generateExport,
    downloadExport,
    isGenerating,
    isDownloading,
    stats,
    isLoading,
    error
  } = useExportWithState(sessionId);

  const [exportOptions, setExportOptions] = useState({
    includeImages: true,
    includeSources: true,
    includeVisualGuide: true,
    format: 'zip' as 'json' | 'zip',
  });

  const handleGenerateExport = () => {
    generateExport({
      sessionId,
      options: exportOptions,
    });
  };

  const handleDownloadExisting = (filename: string) => {
    downloadExport(filename);
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
          <span>Loading export information...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <p>Failed to load export information</p>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Generate New Export
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Format Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Export Format</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={exportOptions.format === 'json' ? 'default' : 'outline'}
                  onClick={() => setExportOptions(prev => ({ ...prev, format: 'json' }))}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  <span>JSON</span>
                  <span className="text-xs text-muted-foreground">Structured data</span>
                </Button>
                <Button
                  variant={exportOptions.format === 'zip' ? 'default' : 'outline'}
                  onClick={() => setExportOptions(prev => ({ ...prev, format: 'zip' }))}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                >
                  <Archive className="w-5 h-5" />
                  <span>ZIP</span>
                  <span className="text-xs text-muted-foreground">Complete package</span>
                </Button>
              </div>
            </div>

            <Separator />

            {/* Include Options */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Include in Export</Label>
              
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
                    Images (0)
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
                    Research Sources (0)
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
                    Visual Guidelines
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
                  Generating Export...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Generate Export
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Export History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <File className="w-5 h-5" />
              Export History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats && stats.total_exports > 0 ? (
              <div className="space-y-4">
                {/* Statistics */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">{stats.total_exports}</div>
                    <div className="text-sm text-muted-foreground">Total Exports</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">{stats.json_exports}</div>
                    <div className="text-sm text-muted-foreground">JSON Files</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">{stats.zip_exports}</div>
                    <div className="text-sm text-muted-foreground">ZIP Files</div>
                  </div>
                </div>

                <Separator />

                {/* Latest Export */}
                {stats.latest_export && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Latest Export</Label>
                    <div className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {stats.latest_export.file_type === 'zip' ? (
                            <Archive className="w-4 h-4 text-blue-600" />
                          ) : (
                            <FileText className="w-4 h-4 text-green-600" />
                          )}
                          <span className="font-medium">
                            {stats.latest_export.file_type.toUpperCase()} Export
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
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="w-3 h-3 mr-2" />
                            Download Again
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
                <p className="text-muted-foreground">No exports generated yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Generate your first export to see it here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
