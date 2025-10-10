import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Export } from '@/components/Export';
import { useSession } from '@/hooks/useSession';
import { useToast } from '@/hooks/use-toast.tsx';
import { ArrowLeft, ArrowRight, CheckCircle, Download } from 'lucide-react';

export function ExportStep() {
  const { t } = useTranslation('step-export');
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: session } = useSession();

  const handlePrevious = () => {
    navigate('/visual');
  };

  const handleComplete = () => {
    toast({
      title: t('notifications.complete.title'),
      description: t('notifications.complete.description'),
    });
    
    // Navigate to a completion page or back to welcome
    navigate('/');
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>{t('status.researchComplete')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>{t('status.visualGuideGenerated')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-blue-600" />
              <span>{t('status.readyToExport')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Component */}
      <Export sessionId={session.id} />

      {/* Navigation */}
      <Card>
        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 p-4 sm:p-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('navigation.back')}
          </Button>

          <div className="text-center order-first sm:order-none">
            <p className="text-sm text-muted-foreground">
              {t('navigation.session')} {session.id.slice(0, 8)}...
            </p>
            <p className="text-xs text-muted-foreground">
              {t('navigation.id')} {session.id.slice(0, 8)}...
            </p>
          </div>

          <Button
            onClick={handleComplete}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 w-full sm:w-auto"
          >
            {t('navigation.complete')}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
