import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Locale, VisualGuideRules } from '@/types';

const QUERY_KEYS = {
  vision: ['vision'] as const,
  visionBySession: (sessionId: string) => ['vision', sessionId] as const,
};

/**
 * Hook for analyzing images with OpenAI Vision
 */
export function useVisionAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      imageUrls: string[];
      locale: Locale;
      brandContext?: string;
      sessionId: string;
    }): Promise<{
      visual_guide: VisualGuideRules;
      guide_md: string;
    }> => {
      const response = await fetch('/api/vision/analyse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_urls: data.imageUrls,
          locale: data.locale,
          brand_context: data.brandContext,
          session_id: data.sessionId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Vision analysis failed');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate vision queries for the session
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.visionBySession(variables.sessionId),
      });

      // Invalidate images to update their status
      queryClient.invalidateQueries({
        queryKey: ['images', variables.sessionId],
      });
    },
  });
}

/**
 * Hook for generating test images
 */
export function useGenerateTestImages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      basePrompt: string;
      negativePrompt?: string;
      count?: number;
      sessionId: string;
    }): Promise<Array<{ url: string; storage_path: string }>> => {
      const response = await fetch('/api/vision/test-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base_prompt: data.basePrompt,
          negative_prompt: data.negativePrompt,
          count: data.count || 1,
          session_id: data.sessionId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Image generation failed');
      }

      return response.json().then(result => result.images);
    },
    onSuccess: (_, variables) => {
      // Invalidate any relevant queries if needed
      queryClient.invalidateQueries({
        queryKey: ['images', variables.sessionId],
      });
    },
  });
}

/**
 * Hook for getting visual guide for a session
 */
export function useVisualGuide(sessionId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.visionBySession(sessionId),
    queryFn: async (): Promise<{
      visual_guide: VisualGuideRules;
      guide_md: string;
    } | null> => {
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

      return {
        visual_guide: data.rules_json,
        guide_md: generateMarkdownFromRules(data.rules_json),
      };
    },
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for vision analysis with loading states
 */
export function useVisionWithState() {
  const visionMutation = useVisionAnalysis();
  const testImageMutation = useGenerateTestImages();

  const analyzeImages = async (
    imageUrls: string[],
    locale: Locale,
    brandContext?: string,
    sessionId?: string
  ) => {
    if (!sessionId) {
      throw new Error('Session ID required');
    }

    try {
      const result = await visionMutation.mutateAsync({
        imageUrls,
        locale,
        brandContext,
        sessionId,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Vision analysis failed',
      };
    }
  };

  const generateTestImages = async (
    basePrompt: string,
    negativePrompt?: string,
    count?: number,
    sessionId?: string
  ) => {
    if (!sessionId) {
      throw new Error('Session ID required');
    }

    try {
      const result = await testImageMutation.mutateAsync({
        basePrompt,
        negativePrompt,
        count,
        sessionId,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Image generation failed',
      };
    }
  };

  return {
    analyzeImages,
    generateTestImages,
    isAnalyzing: visionMutation.isPending,
    isGenerating: testImageMutation.isPending,
    analysisError: visionMutation.error,
    generationError: testImageMutation.error,
    reset: () => {
      visionMutation.reset();
      testImageMutation.reset();
    },
  };
}

/**
 * Generate markdown from visual guide rules (client-side fallback)
 */
function generateMarkdownFromRules(rules: VisualGuideRules): string {
  return `# Visual Brand Guidelines

## General Principles
${rules.general_principles.map(principle => `- ${principle}`).join('\n')}

## Style Direction

### Lighting
${rules.style_direction.lighting}

### Color Approach
${rules.style_direction.colour}

### Composition
${rules.style_direction.composition}

### Format
${rules.style_direction.format}

## Color Palette
- **Primary Colors:** ${rules.palette.primary.join(', ')}
- **Secondary Colors:** ${rules.palette.secondary.join(', ')}
- **Neutral Colors:** ${rules.palette.neutrals.join(', ')}

## People and Emotions
${rules.people_and_emotions.map(item => `- ${item}`).join('\n')}

## Types of Images
${rules.types_of_images.map(category => `
### ${category.category_name}
${category.examples.map(example => `- ${example}`).join('\n')}
`).join('\n')}

## Neuro-Marketing Triggers
${rules.neuro_triggers.map(trigger => `- ${trigger}`).join('\n')}

## Variation Rules
${rules.variation_rules.map(rule => `- ${rule}`).join('\n')}

## Prompting Guidance for AI Image Generation
${rules.prompting_guidance.map(guidance => `- ${guidance}`).join('\n')}

## Producer Notes

### Camera Setup
${rules.producer_notes.camera}

### Lighting Setup
${rules.producer_notes.lighting}

### Camera Angle
${rules.producer_notes.angle}

### Scene Direction
${rules.producer_notes.scene}
`;
}

