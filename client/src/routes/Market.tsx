import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
        title: 'Market Analysis',
        content_md: result.data.content_md,
        status: 'draft',
      });

      toast({
        title: 'Market Analysis Generated',
        description: 'AI has generated your market analysis document',
      });
    }
  };

  const handleSave = () => {
    if (!session || !marketContent) return;

    saveDocument.mutate(
      {
        sessionId: session.id,
        docType: 'market',
        title: 'Market Analysis',
        content_md: marketContent,
        status: 'approved',
      },
      {
        onSuccess: () => {
          setIsEditing(false);
          toast({
            title: 'Market Analysis Saved',
            description: 'Your changes have been saved successfully',
          });
        },
      }
    );
  };

  const handleNext = () => {
    if (!hasGenerated) {
      toast({
        title: 'Generate Market Analysis',
        description: 'Please generate your market analysis before continuing',
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
            <p className="text-muted-foreground">No active session found</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Start New Session
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
                <CardTitle className="text-xl">Market Analysis</CardTitle>
                <p className="text-muted-foreground">
                  Analyze market trends, opportunities, and industry insights
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-sm">
              Step 4 of 6
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Session: <span className="font-medium text-foreground">{session.id.slice(0, 8)}...</span>
          </div>
        </CardContent>
      </Card>

      {/* Generation Section */}
      {!hasGenerated && (
        <Card>
          <CardHeader>
            <CardTitle>Generate Market Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Our AI will research and create a comprehensive market analysis document including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-4">
              <li>Market Size & Growth Potential</li>
              <li>Industry Trends & Dynamics</li>
              <li>Target Market Segments</li>
              <li>Market Opportunities</li>
              <li>Barriers to Entry</li>
              <li>Regulatory Environment</li>
            </ul>

            {error && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-md">
                <p className="font-medium">Generation Failed</p>
                <p className="text-sm">{error.message}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={reset}
                  className="mt-2"
                >
                  Try Again
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
                  Generating Market Analysis...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Generate Market Analysis
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
              <CardTitle>Market Analysis Document</CardTitle>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={saveDocument.isPending}
                    >
                      {saveDocument.isPending ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-3 h-3 mr-2" />
                          Save Changes
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
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRegenerate}
                      disabled={isLoading}
                    >
                      <RotateCcw className="w-3 h-3 mr-2" />
                      Regenerate
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
                placeholder="Edit your market analysis..."
              />
            ) : (
              <MarkdownRenderer content={marketContent} />
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <Button
            variant="outline"
            onClick={() => navigate('/services')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Services
          </Button>

          <Button
            onClick={handleNext}
            disabled={!hasGenerated}
            className="flex items-center gap-2"
          >
            Continue to Competitors
            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
