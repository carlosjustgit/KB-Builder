import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ImageDropzone } from '@/components/ImageDropzone';
import { ImageGrid } from '@/components/ImageGrid';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { useSession } from '@/hooks/useSession';
import { useVisionWithState } from '@/hooks/useVision';
import { useImages } from '@/hooks/useImages';
import { useVisualGuide } from '@/hooks/useVision';
import { useSaveVisualGuide } from '@/hooks/useVisualGuides';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, Sparkles, Download, ArrowRight } from 'lucide-react';

export function Visual() {
  const { t } = useTranslation('step-visual');
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: session } = useSession();
  const { data: uploadedImages } = useImages(session?.id || '', 'user');
  const { data: visualGuide } = useVisualGuide(session?.id || '');
  const saveVisualGuide = useSaveVisualGuide();
  const {
    analyzeImages,
    generateTestImages,
    isAnalyzing,
    isGenerating,
    analysisError,
    generationError,
    reset
  } = useVisionWithState();

  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [analysisResult, setAnalysisResult] = useState<{
    visual_guide: any;
    guide_md: string;
  } | null>(null);
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);

  const handleImagesSelected = (files: File[]) => {
    // This would upload images and get signed URLs
    // For now, we'll simulate this
    console.log('Images selected:', files.length);
    toast({
      title: 'Images Selected',
      description: `${files.length} images selected for analysis.`,
    });
  };

  const handleUrlImport = (url: string) => {
    console.log('URL imported:', url);
    toast({
      title: 'URL Imported',
      description: 'Image URL added for analysis.',
    });
  };

  const handleAnalyzeImages = async () => {
    if (!session || selectedImages.length === 0) return;

    const result = await analyzeImages(
      selectedImages,
      session.language,
      undefined, // brand context for now
      session.id
    );

    if (result.success && result.data) {
      setAnalysisResult(result.data);
      toast({
        title: 'Analysis Complete',
        description: 'Visual brand guidelines generated successfully.',
      });
    } else {
      toast({
        title: 'Analysis Failed',
        description: result.error || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateTestImages = async () => {
    if (!analysisResult || !session) return;

    setIsGeneratingTest(true);

    const result = await generateTestImages(
      analysisResult.visual_guide.base_prompts[0],
      analysisResult.visual_guide.negative_prompts[0],
      2,
      session.id
    );

    setIsGeneratingTest(false);

    if (result.success && result.data) {
      toast({
        title: 'Test Images Generated',
        description: `${result.data.length} test images created.`,
      });
    } else {
      toast({
        title: 'Generation Failed',
        description: result.error || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveGuidelines = async () => {
    if (!analysisResult || !session) return;

    try {
      await saveVisualGuide.mutateAsync({
        sessionId: session.id,
        rules_json: analysisResult.visual_guide,
      });

      toast({
        title: 'Guidelines Saved',
        description: 'Visual brand guidelines have been saved.',
      });

      navigate('/export');
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save visual guidelines.',
        variant: 'destructive',
      });
    }
  };

  if (!session) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading session...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl witfy-text-gradient flex items-center gap-2">
            <Eye className="w-6 h-6" />
            {t('title')}
          </CardTitle>
          <p className="text-muted-foreground">
            {t('subtitle')}
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {t('description')}
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload Images</TabsTrigger>
          <TabsTrigger value="analyze">Analysis</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <ImageDropzone
                onFilesSelected={handleImagesSelected}
                onUrlImport={handleUrlImport}
              />
            </CardContent>
          </Card>

          {/* Uploaded Images Grid */}
          {uploadedImages && uploadedImages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Images ({uploadedImages.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ImageGrid
                  images={uploadedImages.map(img => ({
                    id: img.id,
                    file: new File([], img.file_path),
                    preview: `/api/images/${img.file_path}`, // Would need signed URL
                    status: img.status,
                    size: img.size_bytes,
                  }))}
                  onRemove={(id) => console.log('Remove image:', id)}
                  onAnalyze={() => {
                    // Select all uploaded images for analysis
                    setSelectedImages(uploadedImages.map(img => `/api/images/${img.file_path}`));
                    // Switch to analyze tab
                    document.querySelector('[value="analyze"]')?.click();
                  }}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analyze" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-witfy-500" />
                {t('analysis.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedImages.length > 0 ? (
                <>
                  <div className="p-4 bg-muted/50 rounded-md">
                    <p className="text-sm font-medium mb-2">Selected Images ({selectedImages.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedImages.map((url, index) => (
                        <Badge key={index} variant="secondary">
                          Image {index + 1}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleAnalyzeImages}
                    disabled={isAnalyzing}
                    className="w-full"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('actions.analyzeImages')}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        {t('actions.analyzeImages')}
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  <p>Select images from the Upload tab to analyze them.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Loading State */}
          {isAnalyzing && (
            <Card>
              <CardContent className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-witfy-500" />
                <h3 className="text-lg font-semibold mb-2">{t('loading.title')}</h3>
                <p className="text-muted-foreground">{t('loading.description')}</p>
              </CardContent>
            </Card>
          )}

          {/* Analysis Error */}
          {analysisError && (
            <Card className="border-destructive">
              <CardContent className="p-8 text-center">
                <div className="text-destructive mb-4">
                  <h3 className="text-lg font-semibold">{t('validation.analysisFailed')}</h3>
                  <p className="text-sm">{analysisError.message}</p>
                </div>
                <Button onClick={() => reset()} variant="outline">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {analysisResult ? (
            <>
              {/* Visual Guidelines Display */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-witfy-500" />
                    Visual Brand Guidelines
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="palette" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="palette">Colors</TabsTrigger>
                      <TabsTrigger value="style">Style</TabsTrigger>
                      <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
                      <TabsTrigger value="prompts">AI Prompts</TabsTrigger>
                    </TabsList>

                    <TabsContent value="palette" className="mt-4">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">Primary Colors</h4>
                          <div className="flex gap-2">
                            {analysisResult.visual_guide.palette.primary.map((color: string, index: number) => (
                              <div key={index} className="flex items-center gap-2">
                                <div
                                  className="w-8 h-8 rounded border"
                                  style={{ backgroundColor: color }}
                                />
                                <span className="text-sm font-mono">{color}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">Secondary Colors</h4>
                          <div className="flex gap-2">
                            {analysisResult.visual_guide.palette.secondary.map((color: string, index: number) => (
                              <div key={index} className="flex items-center gap-2">
                                <div
                                  className="w-8 h-8 rounded border"
                                  style={{ backgroundColor: color }}
                                />
                                <span className="text-sm font-mono">{color}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">Neutral Colors</h4>
                          <div className="flex gap-2">
                            {analysisResult.visual_guide.palette.neutrals.map((color: string, index: number) => (
                              <div key={index} className="flex items-center gap-2">
                                <div
                                  className="w-8 h-8 rounded border"
                                  style={{ backgroundColor: color }}
                                />
                                <span className="text-sm font-mono">{color}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="style" className="mt-4">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-2">Lighting Style</h4>
                          <p className="text-sm text-muted-foreground">
                            {analysisResult.visual_guide.lighting}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Composition</h4>
                          <p className="text-sm text-muted-foreground">
                            {analysisResult.visual_guide.composition}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Common Subjects</h4>
                          <div className="flex flex-wrap gap-1">
                            {analysisResult.visual_guide.subjects.map((subject: string, index: number) => (
                              <Badge key={index} variant="outline">{subject}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Textures</h4>
                          <div className="flex flex-wrap gap-1">
                            {analysisResult.visual_guide.textures.map((texture: string, index: number) => (
                              <Badge key={index} variant="outline">{texture}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="guidelines" className="mt-4">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-2 text-green-600">Do's</h4>
                          <ul className="space-y-1">
                            {analysisResult.visual_guide.dos.map((doItem: string, index: number) => (
                              <li key={index} className="text-sm">• {doItem}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2 text-destructive">Don'ts</h4>
                          <ul className="space-y-1">
                            {analysisResult.visual_guide.donts.map((dont: string, index: number) => (
                              <li key={index} className="text-sm">• {dont}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="prompts" className="mt-4">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">Base Prompts</h4>
                          <div className="space-y-2">
                            {analysisResult.visual_guide.base_prompts.map((prompt: string, index: number) => (
                              <div key={index} className="p-3 bg-muted rounded-md">
                                <p className="text-sm">{prompt}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">Negative Prompts</h4>
                          <div className="space-y-2">
                            {analysisResult.visual_guide.negative_prompts.map((prompt: string, index: number) => (
                              <div key={index} className="p-3 bg-muted rounded-md">
                                <p className="text-sm">{prompt}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Test Image Generation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-witfy-500" />
                    {t('generation.title')}
                  </CardTitle>
                  <p className="text-muted-foreground">
                    {t('generation.description')}
                  </p>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleGenerateTestImages}
                    disabled={isGeneratingTest}
                    className="w-full"
                  >
                    {isGeneratingTest ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('generation.generating')}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        {t('actions.generateTest')}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => navigate('/competitors')}>
                  {t('actions.back')}
                </Button>

                <Button onClick={handleSaveGuidelines}>
                  {t('actions.saveGuidelines')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Complete image analysis to see visual guidelines</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

