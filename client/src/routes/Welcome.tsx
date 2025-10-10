import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Locale } from '@/lib/i18n';
import { useCreateSession, useSessionFromParams } from '@/hooks/useSession';
import { useToast } from '@/hooks/use-toast.tsx';
import { useQueryClient } from '@tanstack/react-query';

type WelcomeForm = {
  company_url: string;
};

export function Welcome() {
  const { t, i18n } = useTranslation('step-welcome');
  const queryClient = useQueryClient();
  
  // Define schema inside component to access translations
  const welcomeSchema = z.object({
    company_url: z.string()
      .min(1, t('url.validation.required'))
      .refine(
        (val) => {
          // Auto-prepend https:// for validation if missing
          const urlToValidate = val.match(/^https?:\/\//i) ? val : `https://${val}`;
          try {
            new URL(urlToValidate);
            return true;
          } catch {
            return false;
          }
        },
        { message: t('url.validation.invalid') }
      ),
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  // Initialize from current i18n language instead of hardcoding 'en-US'
  const [selectedLocale, setSelectedLocale] = useState<Locale>((i18n.language as Locale) || 'en-US');
  const [showStartFreshDialog, setShowStartFreshDialog] = useState(false);
  const createSession = useCreateSession();
  const { data: existingSession, isLoading: sessionLoading } = useSessionFromParams();

  // Sync selectedLocale with current i18n language on mount
  useEffect(() => {
    const currentLang = i18n.language as Locale;
    if (currentLang && currentLang !== selectedLocale) {
      setSelectedLocale(currentLang);
    }
  }, [i18n.language]);

  // Check for existing session on component mount
  useEffect(() => {
    if (existingSession && !sessionLoading) {
      console.log('Found existing session:', existingSession.id);
      // Show a notification but don't auto-navigate - give user control
      toast({
        title: t('session.found.title'),
        description: t('session.found.description', { url: existingSession.company_url || t('session.found.defaultUrl') }),
      });
    }
  }, [existingSession, sessionLoading, toast, t]);

  // Handle starting fresh (clearing session data but preserving chat)
  const handleStartFreshClick = () => {
    setShowStartFreshDialog(true);
  };

  const confirmStartFresh = async () => {
    setShowStartFreshDialog(false);
    
    console.log('🗑️ Starting fresh - creating new session...');
    
    try {
      // Clear session ID from localStorage
      localStorage.removeItem('kb_session_id');
      
      // Clear i18n language from localStorage and reset to default
      localStorage.removeItem('i18nextLng');
      const defaultLanguage: Locale = 'en-US';
      await i18n.changeLanguage(defaultLanguage);
      setSelectedLocale(defaultLanguage);
      
      // Clear all cached queries to ensure fresh state
      queryClient.clear();
      
      toast({
        title: t('session.cleared.title'),
        description: t('session.cleared.description'),
      });
    } catch (error) {
      console.error('Error clearing session:', error);
      toast({
        title: t('notifications.error.title'),
        description: t('notifications.error.startFresh'),
        variant: 'destructive',
      });
    }
    // The component will re-render and show the normal welcome form
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WelcomeForm>({
    resolver: zodResolver(welcomeSchema),
    defaultValues: {
      company_url: '',
    },
  });

  const handleLocaleChange = (value: string) => {
    const locale = value as Locale;
    setSelectedLocale(locale);
    i18n.changeLanguage(locale);
  };

  const onSubmit = async (formData: WelcomeForm) => {
    // Auto-prepend https:// if no protocol is present
    let companyUrl = formData.company_url;
    if (companyUrl && !companyUrl.match(/^https?:\/\//i)) {
      companyUrl = `https://${companyUrl}`;
    }

    console.log('🚀 Form submitted with:', formData);
    console.log('📍 Selected locale:', selectedLocale);
    console.log('💾 Current localStorage session ID:', localStorage.getItem('kb_session_id'));

    try {
      // Create a new session (RLS is disabled for development)
      console.log('🔄 Creating session...');
      const session = await createSession.mutateAsync({
        user_id: crypto.randomUUID(), // Generate a unique user ID
        company_url: companyUrl,
        language: selectedLocale,
        step: 'research',
      });

      console.log('✅ Session created:', session);
      console.log('💾 Stored session ID in localStorage:', session.id);

      toast({
        title: t('notifications.success.title'),
        description: t('notifications.success.description'),
      });

      // Navigate to research step
      console.log('🧭 Navigating to research page...');
      navigate(`/research?session=${session.id}`);
    } catch (error) {
      console.error('❌ Error creating session:', error);
      toast({
        title: t('notifications.error.title'),
        description: error instanceof Error ? error.message : t('notifications.error.sessionCreation'),
        variant: 'destructive',
      });
    }
  };

  // Show loading state while checking for existing session
  if (sessionLoading) {
    return (
      <div className="max-w-2xl mx-auto px-2 sm:px-4">
        <Card>
          <CardContent className="p-6 sm:p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-witfy-500 mx-auto mb-4"></div>
            <p className="text-sm sm:text-base text-muted-foreground">{t('session.checking')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show message when no existing session found
  if (!existingSession && !sessionLoading) {
    console.log('No existing session found - ready for new session');
  }

  return (
    <div className="max-w-2xl mx-auto px-2 sm:px-4">
      <Card>
        <CardHeader className="text-center px-4 sm:px-6">
          <CardTitle className="text-2xl sm:text-3xl witfy-text-gradient">
            {t('title')}
          </CardTitle>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t('subtitle')}
          </p>
        </CardHeader>

        <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
          <p className="text-center text-muted-foreground">
            {t('description')}
          </p>

          {/* Session control options */}
          {existingSession && (
            <div className="flex justify-center gap-3">
              <Button
                onClick={() => navigate(`/research?session=${existingSession.id}`)}
                className="witfy-gradient text-white"
              >
                {t('session.continue')}
              </Button>
              <Button
                variant="outline"
                onClick={handleStartFreshClick}
              >
                {t('session.startFresh')}
              </Button>
            </div>
          )}

          {!existingSession && (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStartFreshClick}
                className="text-muted-foreground hover:text-foreground"
              >
                {t('session.startFresh')}
              </Button>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Language selector */}
            <div className="space-y-2">
              <Label htmlFor="locale">{t('locale.label')}</Label>
              <Select value={selectedLocale} onValueChange={handleLocaleChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t('locale.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-US">English (US)</SelectItem>
                  <SelectItem value="en-GB">English (UK)</SelectItem>
                  <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  <SelectItem value="pt-PT">Português (Portugal)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* URL input */}
            <div className="space-y-2">
              <Label htmlFor="company_url">{t('url.label')}</Label>
              <Input
                id="company_url"
                type="text"
                placeholder={t('url.placeholder')}
                {...register('company_url')}
                className={errors.company_url ? 'border-destructive' : ''}
              />
              {errors.company_url && (
                <p className="text-sm text-destructive">
                  {errors.company_url.message}
                </p>
              )}
            </div>

            {/* Time estimate */}
            <div className="text-center p-4 bg-muted/50 rounded-md">
              <p className="text-sm text-muted-foreground">
                ⏱️ {t('estimatedTime')}
              </p>
            </div>

            {/* Submit button */}
            <div className="text-center">
              <Button
                type="submit"
                size="lg"
                className="witfy-gradient text-white hover:opacity-90"
                disabled={createSession.isPending}
                onClick={() => console.log('🔘 Button clicked!')}
              >
                {createSession.isPending ? t('buttons.starting') : t('buttons.next')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Start Fresh Confirmation Dialog */}
      {showStartFreshDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-lg sm:text-xl">{t('session.startFresh')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6">
              <p className="text-sm sm:text-base text-muted-foreground">
                {t('session.startFreshConfirm')}
              </p>
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowStartFreshDialog(false)}
                  className="w-full sm:w-auto"
                >
                  {t('buttons.cancel')}
                </Button>
                <Button
                  onClick={confirmStartFresh}
                  className="witfy-gradient text-white w-full sm:w-auto"
                >
                  {t('buttons.confirm')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

