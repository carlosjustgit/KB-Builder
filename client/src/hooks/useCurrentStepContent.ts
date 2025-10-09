import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Hook to get the current step's content for the chat context
 * This includes both saved documents and current step state
 */
export function useCurrentStepContent(sessionId: string, currentStep: string) {
  return useQuery({
    queryKey: ['currentStepContent', sessionId, currentStep],
    queryFn: async () => {
      if (!sessionId || !currentStep) return null;

      // First, try to get saved document
      const { data: savedDoc } = await supabase
        .from('kb_documents')
        .select('content_md, title, status')
        .eq('session_id', sessionId)
        .eq('doc_type', currentStep)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (savedDoc?.content_md) {
        return savedDoc.content_md;
      }

      // If no saved document, check for any recent research data
      if (currentStep === 'research') {
        const { data: researchData } = await supabase
          .from('kb_documents')
          .select('content_md')
          .eq('session_id', sessionId)
          .eq('doc_type', 'research')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (researchData?.content_md) {
          return researchData.content_md;
        }
      }

      // If still no content, return a helpful message
      return null;
    },
    enabled: !!sessionId && !!currentStep && currentStep !== 'welcome',
    staleTime: 10000, // 10 seconds - shorter for more real-time updates
  });
}
