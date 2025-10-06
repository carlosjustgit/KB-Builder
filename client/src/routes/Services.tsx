import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useSession } from '@/hooks/useSession';
import { useResearchWithState } from '@/hooks/useResearch';
import { useSaveDocument } from '@/hooks/useDocuments';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Package, ArrowLeft, ArrowRight, Edit, Save } from 'lucide-react';

export function Services() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: session } = useSession();
  const { performResearch, isLoading, error, reset } = useResearchWithState();
  const saveDocument = useSaveDocument();

  const [servicesContent, setServicesContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const handleGenerate = async () => {
    if (!session) return;

    const companyUrl = 'https://example.com';

    const result = await performResearch(
      companyUrl,
      session.language,
      'services',
      session.id
    );

    if (result.success && result.data) {
      setServicesContent(result.data.content_md);
      setHasGenerated(true);
      
      saveDocument.mutate({
        sessionId: session.id,
        docType: 'services',
        title: 'Services & Products',
        content_md: result.data.content_md,
        status: 'draft',
      });

      toast({
        title: 'Services Document Generated',
        description: 'AI has generated your services and products document',
      });
    }
  };

  const handleSave = () => {
    if (!session || !servicesContent) return;

    saveDocument.mutate(
      {
        sessionId: session.id,
        docType: 'services',
        title: 'Services & Products',
        content_md: servicesContent,
        status: 'approved',
      },
      {
        onSuccess: () => {
          setIsEditing(false);
          toast({
            title: 'Services Document Saved',
            description: 'Your changes have been saved successfully',
          });
        },
      }
    );
  };

  const handleNext = () => {
    if (!hasGenerated) {
      toast({
        title: 'Generate Services Document',
        description: 'Please generate your services document before continuing',
        variant: 'destructive',
      });
      return;
    }
    navigate('/market');
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
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Services & Products</CardTitle>
                <p className="text-muted-foreground">
                  Document your offerings, features, and value propositions
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-sm">
              Step 3 of 6
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
            <CardTitle>Generate Services Document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Our AI will research and create a comprehensive services and products document including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-4">
              <li>Core Services/Products Overview</li>
              <li>Key Features & Benefits</li>
              <li>Pricing Structure</li>
              <li>Service Packages/Tiers</li>
              <li>Unique Value Propositions</li>
              <li>Implementation Process</li>
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
                  Generating Services Document...
                </>
              ) : (
                <>
                  <Package className="w-4 h-4 mr-2" />
                  Generate Services Document
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
              <CardTitle>Services & Products Document</CardTitle>
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="w-3 h-3 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                value={servicesContent}
                onChange={(e) => setServicesContent(e.target.value)}
                className="min-h-[500px] font-mono text-sm"
                placeholder="Edit your services document..."
              />
            ) : (
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans">{servicesContent}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <Button
            variant="outline"
            onClick={() => navigate('/brand')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Brand
          </Button>

          <Button
            onClick={handleNext}
            disabled={!hasGenerated}
            className="flex items-center gap-2"
          >
            Continue to Market Analysis
            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
