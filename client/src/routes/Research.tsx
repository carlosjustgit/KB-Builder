import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { BottomActionBar } from '@/components/BottomActionBar';
import { useSession } from '@/hooks/useSession';
import { useResearchWithState } from '@/hooks/useResearch';
import { useManualResearch } from '@/hooks/useManualResearch';
import { useSaveDocument } from '@/hooks/useDocuments';
import { useStepContent } from '@/contexts/StepContentContext';
import { Loader2, Check, RotateCcw, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast.tsx';

export function Research() {
  const { t } = useTranslation('step-research');
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const { data: session } = useSession();
  const saveDocument = useSaveDocument();
  const { performResearch, isLoading, error, reset } = useResearchWithState();
  const { performManualResearch, isLoading: isManualLoading, error: manualError, reset: resetManual } = useManualResearch();
  const { setCurrentStepContent } = useStepContent();

  const [researchResult, setResearchResult] = useState<{
    content_md: string;
    sources: Array<{ url: string; snippet: string; provider: string }>;
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Check if we're in manual input mode
  const isManualMode = searchParams.get('mode') === 'manual';
  const manualInput = location.state?.manualInput;

  // Update the current step content whenever researchResult changes
  useEffect(() => {
    console.log('🔄 Research useEffect triggered:', {
      hasResearchResult: !!researchResult,
      contentLength: researchResult?.content_md?.length || 0,
      contentPreview: researchResult?.content_md?.substring(0, 100) + '...' || 'NONE'
    });
    
    if (researchResult?.content_md) {
      console.log('✅ Setting current step content for Wit');
      setCurrentStepContent(researchResult.content_md);
    }
  }, [researchResult, setCurrentStepContent]);

  const handleResearch = async () => {
    if (!session) return;

    // Check if we should use manual input mode
    if (isManualMode && manualInput) {
      console.log('📝 [Research] Using manual input mode');
      const result = await performManualResearch(
        session.id,
        session.language,
        'research',
        manualInput
      );

      if (result.success && result.data) {
        setResearchResult({
          content_md: result.data.content_md,
          sources: result.data.sources,
        });
        
        setCurrentStepContent(result.data.content_md);
        
        toast({
          title: 'Research Complete',
          description: 'AI has analyzed your manual input.',
        });
      } else {
        toast({
          title: 'Research Failed',
          description: result.error || 'Please try again.',
          variant: 'destructive',
        });
      }
    } else {
      // Use the company URL from the session
      const companyUrl = session.company_url || 'https://example.com';
      console.log('🔍 [Research] Session URL:', session.company_url);
      console.log('🔍 [Research] Using URL for API call:', companyUrl);

      const result = await performResearch(
        companyUrl,
        session.language,
        'research',
        session.id
      );
      
      console.log('📊 [Research] API Result:', result);

      if (result.success && result.data) {
        setResearchResult({
          content_md: result.data.content_md,
          sources: result.data.sources.map((s: { url: string; snippet?: string; provider?: string }) => ({
            url: s.url,
            snippet: s.snippet || '',
            provider: s.provider || 'perplexity',
          })),
        });
        
        // Update the current step content for Wit to see
        setCurrentStepContent(result.data.content_md);
        
        toast({
          title: 'Research Complete',
          description: 'AI has analyzed your company information.',
        });
      } else {
        toast({
          title: 'Research Failed',
          description: result.error || 'Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  // Auto-start research if in manual mode
  useEffect(() => {
    if (isManualMode && manualInput && !researchResult && !isManualLoading) {
      handleResearch();
    }
  }, [isManualMode, manualInput]);

  const handleApprove = async () => {
    if (!researchResult || !session) return;

    console.log('💾 Starting save process:', {
      sessionId: session.id,
      contentLength: researchResult.content_md.length,
      contentPreview: researchResult.content_md.substring(0, 100) + '...'
    });

    try {
      // Save the research content as a document
      console.log('🔄 Calling saveDocument.mutateAsync...');
      await saveDocument.mutateAsync({
        sessionId: session.id,
        docType: 'research',
        title: 'Company Research',
        content_md: researchResult.content_md,
        status: 'approved',
      });

      console.log('✅ Document saved successfully');

      toast({
        title: 'Content Saved',
        description: 'Research results have been saved.',
      });

      // Navigate to next step
      console.log('🧭 Navigating to /brand');
      navigate('/brand');
    } catch (error) {
      console.error('❌ Error saving document:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save research results.',
        variant: 'destructive',
      });
    }
  };

  const handleRegenerate = () => {
    if (isManualMode) {
      resetManual();
    } else {
      reset();
    }
    setResearchResult(null);
    handleResearch();
  };

  const currentError = isManualMode ? manualError : error;
  const currentLoading = isManualMode ? isManualLoading : isLoading;

  if (!session) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading session...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-full mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-xl sm:text-2xl witfy-text-gradient">
            {t('title')}
          </CardTitle>
          <p className="text-sm sm:text-base text-muted-foreground">
            {isManualMode ? t('subtitleManual') : t('subtitle')}
          </p>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <p className="text-xs sm:text-sm text-muted-foreground mb-4">
            {isManualMode ? t('descriptionManual') : t('description')}
          </p>
        </CardContent>
      </Card>

      {/* Research Action */}
      {!researchResult && !currentLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">
                  {isManualMode ? t('loading.titleManual') : t('loading.title')}
                </h3>
                <p className="text-muted-foreground">
                  {isManualMode ? t('loading.descriptionManual') : t('loading.description')}
                </p>
              </div>

              <Button
                onClick={handleResearch}
                size="lg"
                className="witfy-gradient text-white"
              >
                {isManualMode ? t('actions.analyzeManual') : t('actions.analyze')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {currentLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-witfy-500" />
              <div>
                <h3 className="text-lg font-semibold">{t('loading.title')}</h3>
                <p className="text-muted-foreground">{t('loading.description')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Research Results */}
      {researchResult && !isEditing && (
        <div className="space-y-6">
          {/* Research Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                {t('results.title')}
              </CardTitle>
              <p className="text-muted-foreground">
                {isManualMode ? t('results.subtitleManual') : t('results.subtitle')}
              </p>
            </CardHeader>
            <CardContent>
              <MarkdownRenderer content={researchResult.content_md} />

              {/* Action Buttons - Top */}
              <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsEditing(true)} className="w-full sm:w-auto">
                  <Edit className="w-4 h-4 mr-2" />
                  {t('results.edit')}
                </Button>
                <Button variant="outline" onClick={handleRegenerate} className="w-full sm:w-auto">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {t('results.regenerate')}
                </Button>
                <Button onClick={handleApprove} className="w-full sm:w-auto sm:ml-auto">
                  {t('results.approve')}
                </Button>
              </div>

              {/* Action Buttons - Bottom */}
              <BottomActionBar
                isEditing={false}
                onEdit={() => setIsEditing(true)}
                onRegenerate={handleRegenerate}
                editLabel={t('results.edit')}
                regenerateLabel={t('results.regenerate')}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>

          {/* Sources */}
          {researchResult.sources && researchResult.sources.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('results.sources')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {researchResult.sources.map((source, index) => (
                    <div key={index} className="p-3 border rounded-md">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-witfy-600 hover:underline font-medium"
                      >
                        {source.url}
                      </a>
                      <p className="text-sm text-muted-foreground mt-1">
                        {source.snippet}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Edit Mode */}
      {researchResult && isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>{t('results.edit')}</CardTitle>
          </CardHeader>
          <CardContent>
            <MarkdownEditor
              value={researchResult.content_md}
              onChange={(value) => {
                setResearchResult({
                  ...researchResult,
                  content_md: value,
                });
              }}
              title="Edit Research Results"
            />

            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsEditing(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button onClick={handleApprove} className="w-full sm:w-auto">
                Save & Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {currentError && !currentLoading && (
        <Card className="border-destructive">
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <div className="text-destructive">
                <h3 className="text-lg font-semibold">{t('validation.researchFailed')}</h3>
                <p className="text-sm">{currentError.message}</p>
              </div>

              <Button onClick={handleRegenerate} variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-2 sm:justify-between">
        <Button variant="outline" onClick={() => navigate('/')} className="w-full sm:w-auto">
          {t('actions.back')}
        </Button>

        {researchResult && (
          <Button onClick={handleApprove} className="w-full sm:w-auto">
            {t('actions.next')}
          </Button>
        )}
      </div>
    </div>
  );
}
