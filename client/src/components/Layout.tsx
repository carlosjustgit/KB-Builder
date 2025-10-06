import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { t } = useTranslation('common');

  return (
    <div className="min-h-screen bg-background">
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
      <div className="flex h-[calc(100vh-73px)]">
        {/* Left side - Main content (70%) */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>

        {/* Right side - Side panel (30%) */}
        <aside className="w-96 border-l border-border">
          <Tabs defaultValue="summary" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-5 m-4 mb-0">
              <TabsTrigger value="summary">{t('tabs.summary')}</TabsTrigger>
              <TabsTrigger value="sources">{t('tabs.sources')}</TabsTrigger>
              <TabsTrigger value="documents">{t('tabs.documents')}</TabsTrigger>
              <TabsTrigger value="visual">{t('tabs.visual')}</TabsTrigger>
              <TabsTrigger value="export">{t('tabs.export')}</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto">
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

              <TabsContent value="documents" className="mt-0 h-full">
                <Card className="m-4 border-0 shadow-none">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">Documents</h3>
                    <p className="text-sm text-muted-foreground">
                      Your saved documents will appear here.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="visual" className="mt-0 h-full">
                <Card className="m-4 border-0 shadow-none">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">Visual Guide</h3>
                    <p className="text-sm text-muted-foreground">
                      Visual brand guidelines will appear here.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="export" className="mt-0 h-full">
                <Card className="m-4 border-0 shadow-none">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">Export</h3>
                    <p className="text-sm text-muted-foreground">
                      Export options and download links will appear here.
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

