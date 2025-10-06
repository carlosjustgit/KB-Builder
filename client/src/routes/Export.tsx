import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Export } from '@/components/Export';
import { useSession } from '@/hooks/useSession';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, CheckCircle, Download } from 'lucide-react';

export function ExportStep() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: session } = useSession();

  const handlePrevious = () => {
    navigate('/visual');
  };

  const handleComplete = () => {
    toast({
      title: 'Knowledge Base Complete!',
      description: 'Your knowledge base has been successfully generated and exported.',
    });
    
    // Navigate to a completion page or back to welcome
    navigate('/');
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
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Export Knowledge Base</CardTitle>
                <p className="text-muted-foreground">
                  Download your complete knowledge base in JSON or ZIP format
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-sm">
              Step 6 of 6
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Research Complete</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Visual Guide Generated</span>
            </div>
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-blue-600" />
              <span>Ready to Export</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Component */}
      <Export sessionId={session.id} />

      {/* Navigation */}
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Visual Guide
          </Button>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Session: {session.id.slice(0, 8)}...
            </p>
            <p className="text-xs text-muted-foreground">
              ID: {session.id.slice(0, 8)}...
            </p>
          </div>

          <Button
            onClick={handleComplete}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            Complete
            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
