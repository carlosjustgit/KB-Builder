import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { useSession } from '@/hooks/useSession';
import { useResearchWithState } from '@/hooks/useResearch';
import { useSaveDocument } from '@/hooks/useDocuments';
import { useToast } from '@/hooks/use-toast.tsx';
import { Loader2, TrendingUp, ArrowLeft, ArrowRight, Edit, Save, RotateCcw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function Market() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation('step-market');
  
  const { data: session } = useSession();
  const { performResearch, isLoading, error, reset } = useResearchWithState();
  const saveDocument = useSaveDocument();

  const [marketContent, setMarketContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Check for existing research data
  useEffect(() => {
    const checkExistingResearch = async () => {
      if (!session) return;

      try {
        const { data: researchDoc, error } = await supabase
          .from('kb_documents')
          .select('content_md')
          .eq('session_id', session.id)
          .eq('doc_type', 'market')
          .single();

        if (researchDoc && !error) {
          setMarketContent(researchDoc.content_md);
          setHasGenerated(true);
        }
      } catch (error) {
        console.error('Error checking existing research:', error);
      }
    };

    checkExistingResearch();
  }, [session]);

  const handleGenerate = async () => {
    if (!session) return;

    const companyUrl = session.company_url || 'https://example.com';

    const result = await performResearch(
      companyUrl,
      session.language,
      'market',
      session.id
    );

    if (result.success && result.data) {
      setMarketContent(result.data.content_md);
      setHasGenerated(true);
      
      saveDocument.mutate({
        sessionId: session.id,
        docType: 'market',
        title: t('title'),
        content_md: result.data.content_md,
        status: 'draft',
      });

      toast({
        title: t('notifications.generated.title'),
        description: t('notifications.generated.description'),
      });
    }
  };

  const handleSave = () => {
    if (!session || !marketContent) return;

    saveDocument.mutate(
      {
        sessionId: session.id,
        docType: 'market',
        title: t('title'),
        content_md: marketContent,
        status: 'approved',
      },
      {
        onSuccess: () => {
          setIsEditing(false);
          toast({
            title: t('notifications.saved.title'),
            description: t('notifications.saved.description'),
          });
        },
      }
    );
  };

  const handleNext = () => {
    if (!hasGenerated) {
      toast({
        title: t('notifications.generateRequired.title'),
        description: t('notifications.generateRequired.description'),
        variant: 'destructive',
      });
      return;
    }
    navigate('/competitors');
  };

  const handleRegenerate = async () => {
    if (!session) return;

    setIsEditing(false);
    setHasGenerated(false);
    setMarketContent('');
    
    // Reset the research state
    reset();
    
    // Generate new content
    await handleGenerate();
  };

  if (!session) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-muted-foreground">{t('noSession.message')}</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              {t('noSession.action')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-full mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-xl">{t('title')}</CardTitle>
                <p className="text-muted-foreground">
                  {t('subtitle')}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-sm">
              {t('stepLabel')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {t('session')} <span className="font-medium text-foreground">{session.id.slice(0, 8)}...</span>
          </div>
        </CardContent>
      </Card>

      {/* Generation Section */}
      {!hasGenerated && (
        <Card>
          <CardHeader>
            <CardTitle>{t('generateCard.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {t('generateCard.description')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-4">
              <li>{t('generateCard.items.marketSize')}</li>
              <li>{t('generateCard.items.industryTrends')}</li>
              <li>{t('generateCard.items.targetMarket')}</li>
              <li>{t('generateCard.items.opportunities')}</li>
              <li>{t('generateCard.items.barriers')}</li>
              <li>{t('generateCard.items.regulatory')}</li>
            </ul>

            {error && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-md">
                <p className="font-medium">{t('error.title')}</p>
                <p className="text-sm">{error.message}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={reset}
                  className="mt-2"
                >
                  {t('error.tryAgain')}
                </Button>
              </div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('loading.generating')}
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  {t('actions.generate')}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Content Editor/Viewer */}
      {hasGenerated && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('documentCard.title')}</CardTitle>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                    >
                      {t('actions.cancel')}
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={saveDocument.isPending}
                    >
                      {saveDocument.isPending ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                          {t('loading.saving')}
                        </>
                      ) : (
                        <>
                          <Save className="w-3 h-3 mr-2" />
                          {t('actions.save')}
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit className="w-3 h-3 mr-2" />
                      {t('actions.edit')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRegenerate}
                      disabled={isLoading}
                    >
                      <RotateCcw className="w-3 h-3 mr-2" />
                      {t('actions.regenerate')}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                value={marketContent}
                onChange={(e) => setMarketContent(e.target.value)}
                className="min-h-[500px] font-mono text-sm"
                placeholder={t('placeholders.editDocument')}
              />
            ) : (
              <MarkdownRenderer content={marketContent} />
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <Card>
        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 p-4 sm:p-6">
          <Button
            variant="outline"
            onClick={() => navigate('/services')}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('actions.back')}
          </Button>

          <Button
            onClick={handleNext}
            disabled={!hasGenerated}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            {t('actions.next')}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
