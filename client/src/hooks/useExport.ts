import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast.tsx';
import { useTranslation } from 'react-i18next';

const QUERY_KEYS = {
  exportStats: (sessionId: string) => ['exportStats', sessionId] as const,
  exportList: (sessionId: string) => ['exportList', sessionId] as const,
};

export interface ExportOptions {
  includeImages: boolean;
  includeSources: boolean;
  includeVisualGuide: boolean;
  format: 'json' | 'zip';
}

export interface ExportStats {
  total_exports: number;
  json_exports: number;
  zip_exports: number;
  total_images: number;
  total_sources: number;
  latest_export?: {
    file_type: 'json' | 'zip';
    created_at: string;
    storage_path: string;
  };
}

/**
 * Hook for generating exports
 */
export function useGenerateExport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation('common');

  return useMutation({
    mutationFn: async (data: {
      sessionId: string;
      options: ExportOptions;
    }) => {
      const response = await fetch('/api/export/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export generation failed');
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from response headers or generate one
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `kb-export-${data.sessionId}-${Date.now()}.${data.options.format}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true, filename };
    },
    onSuccess: (_, variables) => {
      // Invalidate export stats to refresh the UI
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.exportStats(variables.sessionId),
      });
      
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.exportList(variables.sessionId),
      });

      toast({
        title: t('toast.export.generated.title'),
        description: t('toast.export.generated.description', { format: variables.options.format.toUpperCase() }),
      });
    },
    onError: (error) => {
      toast({
        title: t('toast.export.failed.title'),
        description: error instanceof Error ? error.message : t('toast.export.failed.description'),
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for fetching export statistics
 */
export function useExportStats(sessionId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.exportStats(sessionId),
    queryFn: async (): Promise<ExportStats> => {
      const response = await fetch(`/api/export/stats/${sessionId}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch export stats');
      }

      const result = await response.json();
      return result.data;
    },
    enabled: !!sessionId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook for listing exports
 */
export function useExportList(sessionId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.exportList(sessionId),
    queryFn: async () => {
      const response = await fetch(`/api/export/list/${sessionId}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch export list');
      }

      const result = await response.json();
      return result.data;
    },
    enabled: !!sessionId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook for downloading existing export files
 */
export function useDownloadExport() {
  const { toast } = useToast();
  const { t } = useTranslation('common');

  return useMutation({
    mutationFn: async (filename: string) => {
      const response = await fetch(`/api/export/download/${filename}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to download export file');
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true, filename };
    },
    onSuccess: (data) => {
      toast({
        title: t('toast.export.downloadStarted.title'),
        description: t('toast.export.downloadStarted.description', { filename: data.filename }),
      });
    },
    onError: (error) => {
      toast({
        title: t('toast.export.downloadFailed.title'),
        description: error instanceof Error ? error.message : t('toast.export.downloadFailed.description'),
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for downloading PDF for a specific document
 */
export function useDownloadPDF() {
  const { toast } = useToast();
  const { t } = useTranslation('common');

  return useMutation({
    mutationFn: async ({ sessionId, documentId, docType }: { sessionId: string; documentId: string; docType: string }) => {
      const response = await fetch(`/api/export/pdf/${sessionId}/${documentId}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate PDF');
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${docType}-${documentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true, docType };
    },
    onSuccess: (data) => {
      toast({
        variant: 'success',
        title: t('toast.export.pdfDownloaded.title'),
        description: t('toast.export.pdfDownloaded.description', { docType: data.docType }),
      });
    },
    onError: (error) => {
      toast({
        title: t('toast.export.pdfFailed.title'),
        description: error instanceof Error ? error.message : t('toast.export.pdfFailed.description'),
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for export functionality with loading states
 */
export function useExportWithState(sessionId: string) {
  const generateExport = useGenerateExport();
  const downloadExport = useDownloadExport();
  const { data: stats, isLoading: statsLoading, error: statsError } = useExportStats(sessionId);
  const { data: exportList, isLoading: listLoading, error: listError } = useExportList(sessionId);

  return {
    // Export generation
    generateExport: generateExport.mutate,
    isGenerating: generateExport.isPending,
    generationError: generateExport.error,

    // Export download
    downloadExport: downloadExport.mutate,
    isDownloading: downloadExport.isPending,
    downloadError: downloadExport.error,

    // Export data
    stats,
    exportList,
    isLoading: statsLoading || listLoading,
    error: statsError || listError,

    // Reset functions
    resetGeneration: generateExport.reset,
    resetDownload: downloadExport.reset,
  };
}
