import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

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
        title: 'Export Generated',
        description: `${variables.options.format.toUpperCase()} export downloaded successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Failed to generate export',
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
        title: 'Download Started',
        description: `Downloading ${data.filename}`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Download Failed',
        description: error instanceof Error ? error.message : 'Failed to download file',
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
