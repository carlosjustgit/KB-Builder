import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { KBVisualGuide, VisualGuideRules } from '@/types';

const QUERY_KEYS = {
  visualGuide: ['visualGuide'] as const,
  visualGuideBySession: (sessionId: string) => ['visualGuide', sessionId] as const,
};

/**
 * Hook for fetching visual guide for a session
 */
export function useVisualGuide(sessionId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.visualGuideBySession(sessionId),
    queryFn: async (): Promise<KBVisualGuide | null> => {
      const { data, error } = await supabase
        .from('kb_visual_guides')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Visual guide doesn't exist
          return null;
        }
        throw error;
      }

      return data;
    },
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000, // 5 minutes (visual guides don't change often)
  });
}

/**
 * Hook for creating a visual guide
 */
export function useCreateVisualGuide() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      session_id: string;
      rules_json: VisualGuideRules;
      derived_palettes_json?: Record<string, unknown>;
    }) => {
      const { data: visualGuide, error } = await supabase
        .from('kb_visual_guides')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return visualGuide;
    },
    onSuccess: (newVisualGuide) => {
      // Update visual guide cache for the session
      queryClient.setQueryData(
        QUERY_KEYS.visualGuideBySession(newVisualGuide.session_id),
        newVisualGuide
      );
    },
  });
}

/**
 * Hook for updating a visual guide
 */
export function useUpdateVisualGuide() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      visualGuideId: string;
      rules_json?: VisualGuideRules;
      derived_palettes_json?: Record<string, unknown>;
    }) => {
      const { data: visualGuide, error } = await supabase
        .from('kb_visual_guides')
        .update({
          rules_json: data.rules_json,
          derived_palettes_json: data.derived_palettes_json,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.visualGuideId)
        .select()
        .single();

      if (error) throw error;
      return visualGuide;
    },
    onSuccess: (updatedVisualGuide) => {
      // Update visual guide cache for the session
      queryClient.setQueryData(
        QUERY_KEYS.visualGuideBySession(updatedVisualGuide.session_id),
        updatedVisualGuide
      );
    },
  });
}

/**
 * Hook for saving visual guide (creates or updates)
 */
export function useSaveVisualGuide() {
  const createVisualGuide = useCreateVisualGuide();
  const updateVisualGuide = useUpdateVisualGuide();

  return useMutation({
    mutationFn: async (data: {
      sessionId: string;
      rules_json: VisualGuideRules;
      derived_palettes_json?: Record<string, unknown>;
    }) => {
      // Check if visual guide exists
      const { data: existingGuide } = await supabase
        .from('kb_visual_guides')
        .select('id')
        .eq('session_id', data.sessionId)
        .single();

      if (existingGuide) {
        // Update existing visual guide
        const result = await updateVisualGuide.mutateAsync({
          visualGuideId: existingGuide.id,
          rules_json: data.rules_json,
          derived_palettes_json: data.derived_palettes_json,
        });
        return result;
      } else {
        // Create new visual guide
        const result = await createVisualGuide.mutateAsync({
          session_id: data.sessionId,
          rules_json: data.rules_json,
          derived_palettes_json: data.derived_palettes_json,
        });
        return result;
      }
    },
  });
}

/**
 * Hook for deleting a visual guide
 */
export function useDeleteVisualGuide() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (visualGuideId: string) => {
      const { error } = await supabase
        .from('kb_visual_guides')
        .delete()
        .eq('id', visualGuideId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate all visual guide queries since we don't know which session was affected
      queryClient.invalidateQueries({ queryKey: ['visualGuide'] });
    },
  });
}

