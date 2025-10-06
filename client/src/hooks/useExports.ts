import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { KBExport, ExportFileType } from '@/types';

const QUERY_KEYS = {
  exports: ['exports'] as const,
  exportsBySession: (sessionId: string) => ['exports', sessionId] as const,
  exportsByType: (sessionId: string, fileType: ExportFileType) =>
    ['exports', sessionId, fileType] as const,
};

/**
 * Hook for fetching all exports for a session
 */
export function useExports(sessionId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.exportsBySession(sessionId),
    queryFn: async (): Promise<KBExport[]> => {
      const { data, error } = await supabase
        .from('kb_exports')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000, // 5 minutes (exports don't change often)
  });
}

/**
 * Hook for fetching exports by type (JSON or ZIP)
 */
export function useExportsByType(sessionId: string, fileType: ExportFileType) {
  return useQuery({
    queryKey: QUERY_KEYS.exportsByType(sessionId, fileType),
    queryFn: async (): Promise<KBExport[]> => {
      const { data, error } = await supabase
        .from('kb_exports')
        .select('*')
        .eq('session_id', sessionId)
        .eq('file_type', fileType)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!sessionId && !!fileType,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for creating an export record
 */
export function useCreateExport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      session_id: string;
      file_type: ExportFileType;
      storage_path: string;
    }) => {
      const { data: exportRecord, error } = await supabase
        .from('kb_exports')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return exportRecord;
    },
    onSuccess: (newExport) => {
      // Invalidate exports cache for the session
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.exportsBySession(newExport.session_id),
      });

      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.exportsByType(newExport.session_id, newExport.file_type),
      });
    },
  });
}

/**
 * Hook for getting the latest export of a specific type
 */
export function useLatestExport(sessionId: string, fileType: ExportFileType) {
  return useQuery({
    queryKey: ['exports', 'latest', sessionId, fileType],
    queryFn: async (): Promise<KBExport | null> => {
      const { data, error } = await supabase
        .from('kb_exports')
        .select('*')
        .eq('session_id', sessionId)
        .eq('file_type', fileType)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No exports found
          return null;
        }
        throw error;
      }

      return data;
    },
    enabled: !!sessionId && !!fileType,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook for export statistics
 */
export function useExportStats(sessionId: string) {
  return useQuery({
    queryKey: ['exports', 'stats', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kb_exports')
        .select('*')
        .eq('session_id', sessionId);

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        byType: {} as Record<ExportFileType, number>,
        latestExport: null as KBExport | null,
      };

      if (data && data.length > 0) {
        // Count by type
        data.forEach(exportItem => {
          const fileType = exportItem.file_type as ExportFileType;
          stats.byType[fileType] = (stats.byType[fileType] || 0) + 1;
        });

        // Get latest export
        const latest = data.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

        // Set latest export
        stats.latestExport = latest || null;
      }

      return stats;
    },
    enabled: !!sessionId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

