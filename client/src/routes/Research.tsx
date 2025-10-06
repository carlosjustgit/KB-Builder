import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChatBubble } from '@/components/ChatBubble';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { useSession } from '@/hooks/useSession';
import { useResearchWithState } from '@/hooks/useResearch';
import { useSaveDocument } from '@/hooks/useDocuments';
import { useSources } from '@/hooks/useSources';
import { Loader2, Check, RotateCcw, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function Research() {
  const { t } = useTranslation('step-research');
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: session } = useSession();
  const { data: sources } = useSources(session?.id || '');
  const saveDocument = useSaveDocument();
  const { performResearch, isLoading, error, reset } = useResearchWithState();

  const [researchResult, setResearchResult] = useState<{
    content_md: string;
    sources: Array<{ url: string; snippet: string; provider: string }>;
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleResearch = async () => {
    if (!session) return;

    // For now, use a placeholder URL since we don't have company URL stored yet
    // This will be replaced when we implement the full welcome flow
    const companyUrl = 'https://example.com'; // Placeholder

    const result = await performResearch(
      companyUrl,
      session.language,
      'research',
      session.id
    );

    if (result.success && result.data) {
      setResearchResult(result.data);
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
  };

  const handleApprove = async () => {
    if (!researchResult || !session) return;

    try {
      // Save the research content as a document
      await saveDocument.mutateAsync({
        sessionId: session.id,
        docType: 'brand',
        content_md: researchResult.content_md,
        status: 'approved',
      });

      toast({
        title: 'Content Saved',
        description: 'Research results have been saved.',
      });

      // Navigate to next step
      navigate('/brand');
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save research results.',
        variant: 'destructive',
      });
    }
  };

  const handleRegenerate = () => {
    reset();
    setResearchResult(null);
    handleResearch();
  };

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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl witfy-text-gradient">
            {t('title')}
          </CardTitle>
          <p className="text-muted-foreground">
            {t('subtitle')}
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {t('description')}
          </p>
        </CardContent>
      </Card>

      {/* Research Action */}
      {!researchResult && !isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">{t('loading.title')}</h3>
                <p className="text-muted-foreground">{t('loading.description')}</p>
              </div>

              <Button
                onClick={handleResearch}
                size="lg"
                className="witfy-gradient text-white"
              >
                {t('actions.analyze')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
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
                {t('results.subtitle')}
              </p>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none mb-4">
                {researchResult.content_md.split('\n').map((line, index) => (
                  <p key={index} className="mb-2">
                    {line}
                  </p>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  {t('results.edit')}
                </Button>
                <Button variant="outline" onClick={handleRegenerate}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {t('results.regenerate')}
                </Button>
                <Button onClick={handleApprove} className="ml-auto">
                  {t('results.approve')}
                </Button>
              </div>
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

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleApprove}>
                Save & Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Card className="border-destructive">
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <div className="text-destructive">
                <h3 className="text-lg font-semibold">{t('validation.researchFailed')}</h3>
                <p className="text-sm">{error.message}</p>
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
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => navigate('/')}>
          {t('actions.back')}
        </Button>

        {researchResult && (
          <Button onClick={handleApprove}>
            {t('actions.next')}
          </Button>
        )}
      </div>
    </div>
  );
}
