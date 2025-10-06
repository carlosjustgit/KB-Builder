import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Image as ImageIcon, Link } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ImageDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  onUrlImport: (url: string) => void;
  acceptedTypes?: string[];
  maxSize?: number;
  maxFiles?: number;
  className?: string;
}

export function ImageDropzone({
  onFilesSelected,
  onUrlImport,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  maxSize = 10 * 1024 * 1024, // 10MB
  maxFiles = 10,
  className,
}: ImageDropzoneProps) {
  const [urlInput, setUrlInput] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFilesSelected(acceptedFiles);
    }
  }, [onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive: dropzoneDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': acceptedTypes,
    },
    maxSize,
    maxFiles,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  });

  const handleUrlImport = () => {
    if (urlInput.trim()) {
      onUrlImport(urlInput.trim());
      setUrlInput('');
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter(item => item.type.startsWith('image/'));

    if (imageItems.length > 0) {
      const file = imageItems[0].getAsFile();
      if (file) {
        onFilesSelected([file]);
      }
    }
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-6">
        {/* Drop zone */}
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
            (dropzoneDragActive || isDragActive)
              ? 'border-witfy-500 bg-witfy-50'
              : 'border-muted-foreground/25 hover:border-witfy-300 hover:bg-muted/50'
          )}
          onPaste={handlePaste}
        >
          <input {...getInputProps()} />

          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-muted">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>

            <div>
              <p className="text-lg font-medium mb-2">
                {dropzoneDragActive || isDragActive
                  ? 'Drop images here'
                  : 'Upload brand images'}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop images, or click to select files
              </p>
              <p className="text-xs text-muted-foreground">
                Supports: JPG, PNG, WebP • Max {Math.round(maxSize / 1024 / 1024)}MB per file
              </p>
            </div>
          </div>
        </div>

        {/* URL import */}
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm font-medium mb-2">Or import from URL</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <ImageIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full pl-10 pr-3 py-2 border rounded-md text-sm"
                onKeyPress={(e) => e.key === 'Enter' && handleUrlImport()}
              />
            </div>
            <Button
              onClick={handleUrlImport}
              disabled={!urlInput.trim()}
              size="sm"
            >
              <Link className="w-4 h-4 mr-2" />
              Import
            </Button>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-4 p-3 bg-muted/50 rounded-md">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Tips:</strong> Upload 3-5 high-quality images that represent your brand.
            Include logos, website screenshots, social media posts, and product images.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

