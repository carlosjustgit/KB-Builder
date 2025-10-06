import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { KBSession, Locale } from '@/types';

const QUERY_KEYS = {
  session: ['session'] as const,
  sessions: ['sessions'] as const,
};

/**
 * Hook for managing KB sessions
 */
export function useSession() {
  return useQuery({
    queryKey: QUERY_KEYS.session,
    queryFn: async (): Promise<KBSession | null> => {
      // For now, we'll use a hardcoded session ID for testing
      // In production, this would come from URL params or localStorage
      const testSessionId = '00000000-0000-0000-0000-000000000001';

      try {
        const { data, error } = await supabase
          .from('kb_sessions')
          .select('*')
          .eq('id', testSessionId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // Session doesn't exist, create one
            return await createTestSession();
          }
          throw error;
        }

        return data;
      } catch (error) {
        console.error('Error fetching session:', error);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for creating a new session
 */
export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      user_id: string;
      language: Locale;
      step?: string;
      profile_id?: string;
    }) => {
      const { data: session, error } = await supabase
        .from('kb_sessions')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return session;
    },
    onSuccess: (newSession) => {
      // Update the session query cache
      queryClient.setQueryData(QUERY_KEYS.session, newSession);

      // Store session ID for persistence
      localStorage.setItem('kb_session_id', newSession.id);
    },
  });
}

/**
 * Hook for updating session step/progress
 */
export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      sessionId: string;
      step: string;
      language?: Locale;
    }) => {
      const { data: session, error } = await supabase
        .from('kb_sessions')
        .update({
          step: data.step,
          language: data.language,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.sessionId)
        .select()
        .single();

      if (error) throw error;
      return session;
    },
    onSuccess: (updatedSession) => {
      // Update the session query cache
      queryClient.setQueryData(QUERY_KEYS.session, updatedSession);
    },
  });
}

/**
 * Hook for getting session from URL or localStorage
 */
export function useSessionFromParams() {
  const searchParams = new URLSearchParams(window.location.search);
  const sessionId = searchParams.get('session') || localStorage.getItem('kb_session_id');

  return useQuery({
    queryKey: ['session', sessionId],
    queryFn: async (): Promise<KBSession | null> => {
      if (!sessionId) return null;

      const { data, error } = await supabase
        .from('kb_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Session doesn't exist
          return null;
        }
        throw error;
      }

      return data;
    },
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Create a test session for development
 */
async function createTestSession(): Promise<KBSession> {
  const testUserId = '00000000-0000-0000-0000-000000000001';

  const { data: session, error } = await supabase
    .from('kb_sessions')
    .insert({
      user_id: testUserId,
      language: 'en-US',
      step: 'welcome',
    })
    .select()
    .single();

  if (error) throw error;
  return session;
}

/**
 * Hook for session navigation
 */
export function useSessionNavigation() {
  const updateSession = useUpdateSession();

  const goToStep = (step: string, sessionId?: string) => {
    if (!sessionId) return;

    updateSession.mutate({
      sessionId,
      step,
    });
  };

  const nextStep = (currentStep: string, sessionId?: string) => {
    const steps = ['welcome', 'research', 'brand', 'services', 'market', 'competitors', 'visual', 'export'];
    const currentIndex = steps.indexOf(currentStep);
    const nextIndex = Math.min(currentIndex + 1, steps.length - 1);

    if (nextIndex > currentIndex) {
      goToStep(steps[nextIndex], sessionId);
    }
  };

  const previousStep = (currentStep: string, sessionId?: string) => {
    const steps = ['welcome', 'research', 'brand', 'services', 'market', 'competitors', 'visual', 'export'];
    const currentIndex = steps.indexOf(currentStep);
    const prevIndex = Math.max(currentIndex - 1, 0);

    if (prevIndex < currentIndex) {
      goToStep(steps[prevIndex], sessionId);
    }
  };

  return {
    goToStep,
    nextStep,
    previousStep,
    isLoading: updateSession.isPending,
  };
}

