import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { ConversationalAI } from './ConversationalAI';
import { useSession } from '@/hooks/useSession';
import { useStepContent } from '@/contexts/StepContentContext';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { t } = useTranslation('common');
  const { data: session } = useSession();
  const location = useLocation();
  
  // Get current step from pathname
  const getCurrentStep = () => {
    const path = location.pathname;
    if (path.includes('/research')) return 'research';
    if (path.includes('/brand')) return 'brand';
    if (path.includes('/services')) return 'services';
    if (path.includes('/market')) return 'market';
    if (path.includes('/competitors')) return 'competitors';
    if (path.includes('/visual')) return 'visual';
    if (path.includes('/export')) return 'export';
    return 'welcome';
  };

  const currentStep = getCurrentStep();
  const { currentStepContent } = useStepContent();

  // Fetch current step content from database
  const { data: dbStepContent } = useQuery({
    queryKey: ['stepContent', session?.id, currentStep],
    queryFn: async () => {
      console.log('🔍 Fetching step content:', {
        sessionId: session?.id,
        currentStep,
        isWelcome: currentStep === 'welcome'
      });

      if (!session?.id || !currentStep || currentStep === 'welcome') {
        console.log('❌ Skipping content fetch - no session or welcome step');
        return null;
      }

      const { data, error } = await supabase
        .from('kb_documents')
        .select('content_md, doc_type, created_at')
        .eq('session_id', session.id)
        .eq('doc_type', currentStep)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('❌ Error fetching step content:', {
          error,
          sessionId: session.id,
          currentStep,
          errorCode: error.code,
          errorMessage: error.message,
          errorDetails: error.details
        });
        return null;
      }
      
      if (!data || data.length === 0) {
        console.log('❌ No document found for step:', currentStep);
        
        // Let's also check what documents DO exist
        const { data: allDocs } = await supabase
          .from('kb_documents')
          .select('doc_type, created_at')
          .eq('session_id', session.id)
          .order('created_at', { ascending: false });
        
        console.log('📋 Available documents:', allDocs);
        return null;
      }
      
      console.log('✅ Found content for step:', currentStep, 'Length:', data[0].content_md.length);
      return data[0].content_md;
    },
    enabled: !!session?.id && !!currentStep && currentStep !== 'welcome',
    refetchInterval: 2000, // Refetch every 2 seconds to catch updates
  });

  // Use database content if available, otherwise fall back to context
  const actualCurrentContent = dbStepContent || currentStepContent;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="witfy-gradient rounded-md p-2">
              <span className="text-white font-bold text-lg">KB</span>
            </div>
            <h1 className="text-2xl font-bold witfy-text-gradient">
              Builder
            </h1>
          </div>

          {/* Progress indicator (placeholder) */}
          <div className="text-sm text-muted-foreground">
            Step 1 of 7
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex h-[calc(100vh-73px)] overflow-hidden">
        {/* Left side - Main content */}
        <main className="flex-1 overflow-auto min-w-0">
          <div className="p-6">
            {children}
          </div>
        </main>

        {/* Right side - Side panel */}
        <aside className="w-96 min-w-96 border-l border-border flex-shrink-0">
          <Tabs defaultValue="chat" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 m-4 mb-0">
              <TabsTrigger value="chat">💬 Chat</TabsTrigger>
              <TabsTrigger value="summary">{t('tabs.summary')}</TabsTrigger>
              <TabsTrigger value="sources">{t('tabs.sources')}</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto">
              <TabsContent value="chat" className="mt-0 h-full">
                {session ? (
                  <ConversationalAI
                    currentStep={currentStep}
                    companyUrl={session.company_url || ''}
                    sessionId={session.id}
                    currentContent={actualCurrentContent || ''}
                    userLanguage={session.language}
                  />
                ) : (
                  <Card className="m-4 border-0 shadow-none">
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2">AI Chat</h3>
                      <p className="text-sm text-muted-foreground">
                        Start a session to chat with the AI about your research.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="summary" className="mt-0 h-full">
                <Card className="m-4 border-0 shadow-none">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">Project Summary</h3>
                    <p className="text-sm text-muted-foreground">
                      Your knowledge base summary will appear here as you progress through the wizard.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sources" className="mt-0 h-full">
                <Card className="m-4 border-0 shadow-none">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">Sources</h3>
                    <p className="text-sm text-muted-foreground">
                      Research sources and citations will appear here.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </aside>
      </div>

      {/* Footer */}
      <footer className="border-t border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Locale selector placeholder */}
            <div className="text-sm">
              <span className="text-muted-foreground">Language: </span>
              <span className="font-medium">en-US</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              {t('actions.save')}
            </Button>
            <Button variant="outline" size="sm">
              {t('actions.exportJSON')}
            </Button>
            <Button size="sm">
              {t('actions.downloadZIP')}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}

