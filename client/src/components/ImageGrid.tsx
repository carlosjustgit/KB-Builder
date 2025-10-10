import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Upload, CheckCircle, AlertCircle, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

import type { ImageStatus } from '@/types';

export interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  status: ImageStatus;
  error?: string;
  size?: number;
}

export interface ImageGridProps {
  images: UploadedImage[];
  onRemove: (id: string) => void;
  onAnalyze?: () => void;
  isAnalyzing?: boolean;
  className?: string;
}

export function ImageGrid({ images, onRemove, onAnalyze, isAnalyzing, className }: ImageGridProps) {
  const { t } = useTranslation('step-visual');
  
  if (images.length === 0) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-8 text-center">
          <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{t('upload.grid.noImages')}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {t('upload.grid.noImagesDescription')}
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: UploadedImage['status']) => {
    switch (status) {
      case 'uploading':
        return <Upload className="w-3 h-3 animate-pulse" />;
      case 'analyzing':
        return <div className="w-3 h-3 border-2 border-witfy-500 border-t-transparent rounded-full animate-spin" />;
      case 'analyzed':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-3 h-3 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: UploadedImage['status']) => {
    switch (status) {
      case 'uploading':
      case 'analyzing':
        return 'bg-blue-100 text-blue-800';
      case 'analyzed':
      case 'analysed':
        return 'bg-green-100 text-green-800';
      case 'error':
      case 'rejected':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted';
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Header with analyze button */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          {t('upload.grid.uploadedImages', { count: images.length })}
        </h3>
        {onAnalyze && (
          <Button
            onClick={onAnalyze}
            disabled={isAnalyzing || images.some(img => img.status === 'uploading' || img.status === 'analyzing')}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('upload.grid.analyzing')}
              </>
            ) : (
              t('upload.grid.analyzeButton')
            )}
          </Button>
        )}
      </div>

      {/* Image grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => (
          <Card key={image.id} className="relative group overflow-hidden">
            <CardContent className="p-0">
              {/* Image */}
              <div className="relative aspect-square bg-muted">
                <img
                  src={image.preview}
                  alt={image.file.name}
                  className="w-full h-full object-cover"
                />

                {/* Status overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="flex items-center gap-2 text-white text-sm">
                    {getStatusIcon(image.status)}
                    <span className="capitalize">{t(`upload.grid.status.${image.status}`)}</span>
                  </div>
                </div>

                {/* Remove button */}
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onRemove(image.id)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>

              {/* Image info */}
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" className={cn('text-xs', getStatusColor(image.status))}>
                    {t(`upload.grid.status.${image.status}`)}
                  </Badge>
                  {image.size && (
                    <span className="text-xs text-muted-foreground">
                      {Math.round(image.size / 1024)}KB
                    </span>
                  )}
                </div>

                <p className="text-sm font-medium truncate" title={image.file.name}>
                  {image.file.name}
                </p>

                {image.error && (
                  <p className="text-xs text-destructive mt-1">
                    {image.error}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 p-3 bg-muted/50 rounded-md">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span>
              {t('upload.grid.summary.analyzed', { count: images.filter(img => img.status === 'analyzed').length })}
            </span>
            <span>
              {t('upload.grid.summary.uploading', { count: images.filter(img => img.status === 'uploading').length })}
            </span>
            <span>
              {t('upload.grid.summary.errors', { count: images.filter(img => img.status === 'error').length })}
            </span>
          </div>
          <span className="text-muted-foreground">
            {t('upload.grid.summary.total', { count: images.length })}
          </span>
        </div>
      </div>
    </div>
  );
}

