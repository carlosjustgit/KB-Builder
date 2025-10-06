import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { KBSource, AIProvider } from '@/types';

const QUERY_KEYS = {
  sources: ['sources'] as const,
  sourcesBySession: (sessionId: string) => ['sources', sessionId] as const,
};

/**
 * Hook for fetching all sources for a session
 */
export function useSources(sessionId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.sourcesBySession(sessionId),
    queryFn: async (): Promise<KBSource[]> => {
      const { data, error } = await supabase
        .from('kb_sources')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000, // 5 minutes (sources don't change often)
  });
}

/**
 * Hook for creating multiple sources at once (batch insert)
 */
export function useCreateSources() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sources: Array<{
      session_id: string;
      url: string;
      provider?: AIProvider;
      snippet?: string;
    }>) => {
      const { data, error } = await supabase
        .from('kb_sources')
        .insert(sources)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (newSources) => {
      // Invalidate sources cache for the session
      if (newSources && newSources.length > 0) {
        const sessionId = newSources[0].session_id;
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.sourcesBySession(sessionId),
        });
      }
    },
  });
}

/**
 * Hook for creating a single source
 */
export function useCreateSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      session_id: string;
      url: string;
      provider?: AIProvider;
      snippet?: string;
    }) => {
      const { data: source, error } = await supabase
        .from('kb_sources')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return source;
    },
    onSuccess: (newSource) => {
      // Invalidate sources cache for the session
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.sourcesBySession(newSource.session_id),
      });
    },
  });
}

/**
 * Hook for deleting sources for a session
 */
export function useDeleteSources() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('kb_sources')
        .delete()
        .eq('session_id', sessionId);

      if (error) throw error;
    },
    onSuccess: (_, sessionId) => {
      // Invalidate sources cache for the session
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.sourcesBySession(sessionId),
      });
    },
  });
}

/**
 * Hook for getting source statistics
 */
export function useSourceStats(sessionId: string) {
  return useQuery({
    queryKey: ['sources', 'stats', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kb_sources')
        .select('provider')
        .eq('session_id', sessionId);

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        byProvider: {} as Record<AIProvider, number>,
      };

      data?.forEach(source => {
        if (source.provider) {
          const provider = source.provider as AIProvider;
          stats.byProvider[provider] = (stats.byProvider[provider] || 0) + 1;
        }
      });

      return stats;
    },
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

