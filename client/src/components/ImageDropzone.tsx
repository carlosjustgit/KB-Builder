import React, { useCallback, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Image as ImageIcon, Link } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ImageDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  onUrlImport: (url: string) => void;
  maxSize?: number;
  className?: string;
  isLoading?: boolean;
}

export function ImageDropzone({
  onFilesSelected,
  onUrlImport,
  maxSize = 10 * 1024 * 1024, // 10MB
  className,
  isLoading = false,
}: ImageDropzoneProps) {
  const { t } = useTranslation('step-visual');
  const [urlInput, setUrlInput] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    console.log('📁 Files selected:', files.length);
    
    // Filter for image files only
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    console.log('🖼️ Image files found:', imageFiles.length);
    
    if (imageFiles.length > 0 && !isLoading) {
      onFilesSelected(imageFiles);
    } else if (files.length > 0) {
      console.log('⚠️ No image files found in selected files');
    }
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFilesSelected, isLoading]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    console.log('📁 Files dropped:', files.length);
    
    // Filter for image files only
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    console.log('🖼️ Image files found:', imageFiles.length);
    
    if (imageFiles.length > 0 && !isLoading) {
      onFilesSelected(imageFiles);
    } else if (files.length > 0) {
      console.log('⚠️ No image files found in dropped files');
    }
  }, [onFilesSelected, isLoading]);

  const handleUrlImport = () => {
    if (urlInput.trim() && !isLoading) {
      onUrlImport(urlInput.trim());
      setUrlInput('');
    }
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    if (isLoading) return;
    
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter(item => item.type.startsWith('image/'));

    if (imageItems.length > 0) {
      const file = imageItems[0].getAsFile();
      if (file) {
        console.log('📋 Image pasted from clipboard');
        onFilesSelected([file]);
      }
    }
  }, [onFilesSelected, isLoading]);

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-6">
        {/* Drop zone */}
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
            isLoading 
              ? 'border-muted-foreground/25 bg-muted/25 cursor-not-allowed opacity-50'
              : 'cursor-pointer',
            isDragActive && !isLoading
              ? 'border-witfy-500 bg-witfy-50'
              : !isLoading && 'border-muted-foreground/25 hover:border-witfy-300 hover:bg-muted/50'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onPaste={handlePaste}
          onClick={() => !isLoading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-muted">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>

            <div>
              <p className="text-lg font-medium mb-2">
                {isLoading
                  ? t('upload.dropzone.uploadingTitle')
                  : isDragActive
                  ? t('upload.dropzone.dropHere')
                  : t('upload.dropzone.uploadBrandImages')}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {isLoading
                  ? t('upload.dropzone.uploadingDescription')
                  : t('upload.dropzone.dragAndDrop')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('upload.dropzone.supports', { maxSize: Math.round(maxSize / 1024 / 1024) })}
              </p>
            </div>
          </div>
        </div>

        {/* URL import */}
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm font-medium mb-2">{t('upload.dropzone.urlPrompt')}</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <ImageIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder={t('upload.dropzone.urlPlaceholder')}
                className="w-full pl-10 pr-3 py-2 border rounded-md text-sm"
                onKeyPress={(e) => e.key === 'Enter' && handleUrlImport()}
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={handleUrlImport}
              disabled={!urlInput.trim() || isLoading}
              size="sm"
            >
              <Link className="w-4 h-4 mr-2" />
              {t('upload.dropzone.importButton')}
            </Button>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-4 p-3 bg-muted/50 rounded-md">
          <p className="text-xs text-muted-foreground">
            {t('upload.dropzone.tips')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

