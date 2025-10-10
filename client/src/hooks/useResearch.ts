import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Locale, KBSource } from '@/types';

interface ResearchResponse {
  content_md: string;
  sources: KBSource[];
}

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
      console.log('🔍 [Research] Starting API call:', { 
        url: data.companyUrl, 
        step: data.step,
        locale: data.locale 
      });

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      try {
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
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        console.log('📡 [Research] Response received:', { status: response.status, ok: response.ok });

        if (!response.ok) {
        let errorMessage = 'Research failed';
        try {
          const error = await response.json();
          errorMessage = error.message || error.error || 'Research failed';
          console.error('❌ [Research] API Error:', { status: response.status, error });
        } catch (parseError) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || 'Research failed';
          console.error('❌ [Research] Non-JSON Error:', { 
            status: response.status, 
            statusText: response.statusText,
            parseError 
          });
        }
        throw new Error(errorMessage);
      }

        try {
          return await response.json();
        } catch (error) {
          console.error('❌ [Research] JSON Parse Error:', error);
          throw new Error('Invalid response format from server');
        }
      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            console.error('❌ [Research] Timeout - Request took longer than 60 seconds');
            throw new Error('Request timed out. Please try again or check your internet connection.');
          }
          console.error('❌ [Research] Network Error:', error);
          throw error;
        }
        
        console.error('❌ [Research] Unknown Error:', error);
        throw new Error('Network error. Please check your internet connection and try again.');
      }
    },
    onSuccess: (_, variables) => {
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

