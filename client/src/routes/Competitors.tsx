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
import { useToast } from '@/hooks/use-toast';
import { Loader2, Target, ArrowLeft, ArrowRight, Edit, Save, RotateCcw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function Competitors() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: session } = useSession();
  const { performResearch, isLoading, error, reset } = useResearchWithState();
  const saveDocument = useSaveDocument();

  const [competitorsContent, setCompetitorsContent] = useState('');
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
          .eq('doc_type', 'competitors')
          .single();

        if (researchDoc && !error) {
          setCompetitorsContent(researchDoc.content_md);
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
      'competitors',
      session.id
    );

    if (result.success && result.data) {
      setCompetitorsContent(result.data.content_md);
      setHasGenerated(true);
      
      saveDocument.mutate({
        sessionId: session.id,
        docType: 'competitors',
        title: 'Competitor Analysis',
        content_md: result.data.content_md,
        status: 'draft',
      });

      toast({
        title: 'Competitor Analysis Generated',
        description: 'AI has generated your competitor analysis document',
      });
    }
  };

  const handleSave = () => {
    if (!session || !competitorsContent) return;

    saveDocument.mutate(
      {
        sessionId: session.id,
        docType: 'competitors',
        title: 'Competitor Analysis',
        content_md: competitorsContent,
        status: 'approved',
      },
      {
        onSuccess: () => {
          setIsEditing(false);
          toast({
            title: 'Competitor Analysis Saved',
            description: 'Your changes have been saved successfully',
          });
        },
      }
    );
  };

  const handleNext = () => {
    if (!hasGenerated) {
      toast({
        title: 'Generate Competitor Analysis',
        description: 'Please generate your competitor analysis before continuing',
        variant: 'destructive',
      });
      return;
    }
    navigate('/visual');
  };

  const handleRegenerate = async () => {
    if (!session) return;

    setIsEditing(false);
    setHasGenerated(false);
    setCompetitorsContent('');
    
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
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Target className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Competitor Analysis</CardTitle>
                <p className="text-muted-foreground">
                  Identify and analyze key competitors and market positioning
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-sm">
              Step 5 of 6
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
            <CardTitle>Generate Competitor Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Our AI will research and create a comprehensive competitor analysis document including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-4">
              <li>Key Competitors Overview</li>
              <li>Competitive Advantages & Weaknesses</li>
              <li>Market Share & Positioning</li>
              <li>Pricing Strategies</li>
              <li>Differentiation Opportunities</li>
              <li>Competitive Response Strategies</li>
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
                  Generating Competitor Analysis...
                </>
              ) : (
                <>
                  <Target className="w-4 h-4 mr-2" />
                  Generate Competitor Analysis
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
              <CardTitle>Competitor Analysis Document</CardTitle>
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
                value={competitorsContent}
                onChange={(e) => setCompetitorsContent(e.target.value)}
                className="min-h-[500px] font-mono text-sm"
                placeholder="Edit your competitor analysis..."
              />
            ) : (
              <MarkdownRenderer content={competitorsContent} />
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <Button
            variant="outline"
            onClick={() => navigate('/market')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Market Analysis
          </Button>

          <Button
            onClick={handleNext}
            disabled={!hasGenerated}
            className="flex items-center gap-2"
          >
            Continue to Visual Guide
            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
