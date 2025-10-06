import React from 'react';
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

const welcomeSchema = z.object({
  company_url: z.string().url('Please enter a valid URL'),
});

type WelcomeForm = z.infer<typeof welcomeSchema>;

export function Welcome() {
  const { t, i18n } = useTranslation('step-welcome');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<WelcomeForm>({
    resolver: zodResolver(welcomeSchema),
    defaultValues: {
      company_url: '',
    },
  });

  const selectedLocale = watch('locale') || 'en-US';

  const handleLocaleChange = (value: string) => {
    i18n.changeLanguage(value as Locale);
    setValue('locale', value);
  };

  const onSubmit = (data: WelcomeForm) => {
    console.log('Starting KB Builder with:', data);
    // TODO: Navigate to research step and create session
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl witfy-text-gradient">
            {t('title')}
          </CardTitle>
          <p className="text-muted-foreground">
            {t('subtitle')}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground">
            {t('description')}
          </p>

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
                type="url"
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
              >
                {t('buttons.next')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

