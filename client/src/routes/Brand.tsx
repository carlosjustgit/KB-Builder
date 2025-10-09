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
import { useStepContent } from '@/contexts/StepContentContext';
import { useToast } from '@/hooks/use-toast.tsx';
import { Loader2, Sparkles, ArrowLeft, ArrowRight, Edit, Save, RotateCcw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function Brand() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: session } = useSession();
  const { performResearch, isLoading, error, reset } = useResearchWithState();
  const saveDocument = useSaveDocument();
  const { setCurrentStepContent } = useStepContent();

  const [brandContent, setBrandContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Check for existing brand content
  useEffect(() => {
    const checkExistingBrand = async () => {
      if (!session) return;

      try {
        const { data: brandDoc, error } = await supabase
          .from('kb_documents')
          .select('content_md')
          .eq('session_id', session.id)
          .eq('doc_type', 'brand')
          .single();

        if (brandDoc && !error) {
          setBrandContent(brandDoc.content_md);
          setHasGenerated(true);
        }
      } catch (error) {
        console.error('Error checking existing brand content:', error);
      }
    };

    checkExistingBrand();
  }, [session]);

  // Update the current step content whenever brandContent changes
  useEffect(() => {
    console.log('🔄 Brand useEffect triggered:', {
      hasBrandContent: !!brandContent,
      contentLength: brandContent?.length || 0,
      contentPreview: brandContent?.substring(0, 100) + '...' || 'NONE'
    });
    
    if (brandContent) {
      console.log('✅ Setting current step content for Wit');
      setCurrentStepContent(brandContent);
    }
  }, [brandContent, setCurrentStepContent]);

  const handleGenerate = async () => {
    if (!session) return;

    // Use the company URL from the session
    const companyUrl = session.company_url || 'https://example.com';

    const result = await performResearch(
      companyUrl,
      session.language,
      'brand',
      session.id
    );

    if (result.success && result.data) {
      setBrandContent(result.data.content_md);
      setHasGenerated(true);

      // Auto-save as draft
      saveDocument.mutate({
        sessionId: session.id,
        docType: 'brand',
        title: 'Brand Identity',
        content_md: result.data.content_md,
        status: 'draft',
      });

      toast({
        title: 'Brand Document Generated',
        description: 'AI has generated your brand identity document',
      });
    }
  };

  const handleSave = () => {
    if (!session || !brandContent) return;

    saveDocument.mutate(
      {
        sessionId: session.id,
        docType: 'brand',
        title: 'Brand Identity',
        content_md: brandContent,
        status: 'approved',
      },
      {
        onSuccess: () => {
          setIsEditing(false);
          toast({
            title: 'Brand Document Saved',
            description: 'Your changes have been saved successfully',
          });
        },
      }
    );
  };

  const handleNext = () => {
    if (!hasGenerated) {
      toast({
        title: 'Generate Brand Document',
        description: 'Please generate your brand document before continuing',
        variant: 'destructive',
      });
      return;
    }
    navigate('/services');
  };

  const handleRegenerate = async () => {
    if (!session) return;

    setIsEditing(false);
    setHasGenerated(false);
    setBrandContent('');
    
    // Reset the research state
    reset();
    
    // Generate new content
    await handleGenerate();
  };

  if (!session) {
    return (
      <Card className="w-full max-w-full mx-auto">
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
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Brand Identity</CardTitle>
                <p className="text-muted-foreground">
                  Define your brand's mission, vision, and core values
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-sm">
              Step 2 of 6
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
            <CardTitle>Generate Brand Document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Our AI will research and create a comprehensive brand identity document including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-4">
              <li>Mission Statement</li>
              <li>Vision Statement</li>
              <li>Core Values</li>
              <li>Brand Promise</li>
              <li>Brand Personality</li>
              <li>Target Audience</li>
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
                  Generating Brand Document...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Brand Document
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
              <CardTitle>Brand Identity Document</CardTitle>
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
                value={brandContent}
                onChange={(e) => setBrandContent(e.target.value)}
                className="min-h-[500px] font-mono text-sm"
                placeholder="Edit your brand document..."
              />
            ) : (
              <MarkdownRenderer content={brandContent} />
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <Button
            variant="outline"
            onClick={() => navigate('/research')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Research
          </Button>

          <Button
            onClick={handleNext}
            disabled={!hasGenerated}
            className="flex items-center gap-2"
          >
            Continue to Services
            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
