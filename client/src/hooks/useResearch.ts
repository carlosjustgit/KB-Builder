import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ResearchRequest, ResearchResponse, Locale } from '@/types';

const QUERY_KEYS = {
  research: ['research'] as const,
};

/**
 * Hook for performing AI research
 */
export function useResearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      companyUrl: string;
      locale: Locale;
      step: 'research' | 'brand' | 'services' | 'market' | 'competitors';
      sessionId: string;
    }): Promise<ResearchResponse> => {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_url: data.companyUrl,
          locale: data.locale,
          step: data.step,
          session_id: data.sessionId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Research failed');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ['documents', variables.sessionId],
      });
      queryClient.invalidateQueries({
        queryKey: ['sources', variables.sessionId],
      });

      // Update session step for research step
      if (variables.step === 'research') {
        queryClient.invalidateQueries({
          queryKey: ['session', variables.sessionId],
        });
      }
    },
  });
}

/**
 * Hook for research with loading states
 */
export function useResearchWithState() {
  const researchMutation = useResearch();

  const performResearch = async (
    companyUrl: string,
    locale: Locale,
    step: 'research' | 'brand' | 'services' | 'market' | 'competitors',
    sessionId: string
  ) => {
    try {
      const result = await researchMutation.mutateAsync({
        companyUrl,
        locale,
        step,
        sessionId,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Research failed',
      };
    }
  };

  return {
    performResearch,
    isLoading: researchMutation.isPending,
    error: researchMutation.error,
    reset: researchMutation.reset,
  };
}

/**
 * Hook for getting research history for a session
 */
export function useResearchHistory(sessionId: string) {
  return useQuery({
    queryKey: ['research', 'history', sessionId],
    queryFn: async () => {
      // This could be extended to track research attempts
      // For now, return basic info
      const { data: sources } = await supabase
        .from('kb_sources')
        .select('provider, created_at')
        .eq('session_id', sessionId)
        .eq('provider', 'perplexity');

      return {
        totalResearchCalls: sources?.length || 0,
        lastResearchDate: sources?.[0]?.created_at || null,
      };
    },
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

