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
      console.log('💾 [VG] Creating visual guide for session:', data.session_id);
      const { data: visualGuide, error } = await supabase
        .from('kb_visual_guides')
        .insert(data)
        .select()
        .single();

      if (error) {
        console.error('❌ [VG] Create failed:', error);
        throw new Error(error.message || 'Failed to create visual guide');
      }
      console.log('✅ [VG] Created successfully');
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
      console.log('💾 [VG] Updating visual guide:', data.visualGuideId);
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

      if (error) {
        console.error('❌ [VG] Update failed:', error);
        throw new Error(error.message || 'Failed to update visual guide');
      }
      console.log('✅ [VG] Updated successfully');
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
      console.log('💾 [VG] Checking for existing guide...');
      // Check if visual guide exists
      const { data: existingGuide, error: checkError } = await supabase
        .from('kb_visual_guides')
        .select('id')
        .eq('session_id', data.sessionId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ [VG] Check failed:', checkError);
        throw new Error(checkError.message || 'Failed to check for existing guide');
      }

      if (existingGuide) {
        console.log('📝 [VG] Updating existing guide');
        // Update existing visual guide
        const result = await updateVisualGuide.mutateAsync({
          visualGuideId: existingGuide.id,
          rules_json: data.rules_json,
          derived_palettes_json: data.derived_palettes_json,
        });
        return result;
      } else {
        console.log('✨ [VG] Creating new guide');
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

