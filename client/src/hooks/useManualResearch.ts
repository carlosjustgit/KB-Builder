import { useState } from 'react';

interface ManualInput {
  company_description: string;
  competitors?: string; // String input, converted to array when sent to API
  services?: string;
  additional_info?: string;
}

interface ManualResearchResult {
  content_md: string;
  sources: Array<{
    url: string;
    snippet: string;
    provider: string;
  }>;
  quality_score?: number;
  confidence_score?: number;
  providers_used?: string[];
}

interface UseManualResearchReturn {
  performManualResearch: (
    sessionId: string,
    locale: string,
    step: string,
    manualInput: ManualInput
  ) => Promise<{ success: boolean; data?: ManualResearchResult; error?: string }>;
  isLoading: boolean;
  error: Error | null;
  reset: () => void;
}

/**
 * Hook for performing research with manual input
 */
export function useManualResearch(): UseManualResearchReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const performManualResearch = async (
    sessionId: string,
    locale: string,
    step: string,
    manualInput: ManualInput
  ): Promise<{ success: boolean; data?: ManualResearchResult; error?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('📝 [Manual Research Hook] Starting manual research...');
      console.log('📝 [Manual Research Hook] Session ID:', sessionId);
      console.log('📝 [Manual Research Hook] Step:', step);
      console.log('📝 [Manual Research Hook] Manual input length:', manualInput.company_description.length);

      const response = await fetch('/api/research-manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          locale,
          step,
          manual_input: {
            company_description: manualInput.company_description,
            competitors: Array.isArray(manualInput.competitors) 
              ? manualInput.competitors 
              : manualInput.competitors?.split(/[,\n]+/).map((c: string) => c.trim()).filter(Boolean),
            services: manualInput.services,
            additional_info: manualInput.additional_info,
          },
        }),
      });

      console.log('📡 [Manual Research Hook] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Manual research failed');
      }

      const data = await response.json() as ManualResearchResult;

      console.log('✅ [Manual Research Hook] Research complete');
      console.log('📊 [Manual Research Hook] Quality score:', data.quality_score);
      console.log('📊 [Manual Research Hook] Providers used:', data.providers_used);

      setIsLoading(false);
      return { success: true, data };
    } catch (err) {
      console.error('❌ [Manual Research Hook] Error:', err);
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      setIsLoading(false);
      return { success: false, error: error.message };
    }
  };

  const reset = () => {
    setError(null);
    setIsLoading(false);
  };

  return {
    performManualResearch,
    isLoading,
    error,
    reset,
  };
}

