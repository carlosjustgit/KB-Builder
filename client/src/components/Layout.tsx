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
import { useDocuments } from '@/hooks/useDocuments';
import { useSources } from '@/hooks/useSources';
import { SmartDiscoveryBar } from './discovery/SmartDiscoveryBar';

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

  // Fetch documents and sources for sidebar
  const { data: documents } = useDocuments(session?.id || '');
  const { data: sources } = useSources(session?.id || '');

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
          <div className="flex items-center space-x-3">
            <img 
              src="/logo-Witfy-icon-main.png" 
              alt="Witfy Logo" 
              className="h-10 w-10 object-contain"
            />
            <h1 className="text-2xl font-bold witfy-text-gradient">
              Witfy Origin
            </h1>
          </div>

          {/* Launch Witfy Button */}
          <a 
            href="https://app.witfy.social/" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button className="witfy-gradient text-white hover:opacity-90 transition-opacity">
              🚀 {t('actions.launchWitfy')}
            </Button>
          </a>
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
                      <h3 className="font-semibold mb-2">{t('chat.title')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('chat.noSession')}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="summary" className="mt-0 h-full">
                <Card className="m-4 border-0 shadow-none">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">{t('sidebar.summary.title')}</h3>
                    {documents && documents.length > 0 ? (
                      <div className="space-y-3">
                        {documents.map((doc) => (
                          <div key={doc.id} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium capitalize">{doc.doc_type}</h4>
                              <span className={`text-xs px-2 py-1 rounded ${
                                doc.status === 'approved' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {t(`status.${doc.status}`)}
                              </span>
                            </div>
                            {doc.title && (
                              <p className="text-sm text-muted-foreground mb-2">{doc.title}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {doc.content_md?.substring(0, 100)}...
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {t('sidebar.summary.placeholder')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sources" className="mt-0 h-full">
                <Card className="m-4 border-0 shadow-none">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">{t('sidebar.sources.title')}</h3>
                    {sources && sources.length > 0 ? (
                      <div className="space-y-3">
                        {sources.map((source) => (
                          <div key={source.id} className="border rounded-lg p-3">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h4 className="font-medium text-sm truncate flex-1 min-w-0">
                                {source.url}
                              </h4>
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded whitespace-nowrap flex-shrink-0">
                                {source.provider || 'Unknown'}
                              </span>
                            </div>
                            <a 
                              href={source.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline block mb-2 break-all"
                            >
                              {source.url}
                            </a>
                            {source.snippet && (
                              <p className="text-xs text-muted-foreground break-words">
                                {source.snippet.substring(0, 150)}...
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {t('sidebar.sources.noSources')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </aside>
      </div>

      {/* Footer - Smart Discovery Bar */}
      <SmartDiscoveryBar />
    </div>
  );
}

