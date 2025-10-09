import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ImageDropzone } from '@/components/ImageDropzone';
import { ImageGrid } from '@/components/ImageGrid';
import { useSession } from '@/hooks/useSession';
import { useVisionWithState } from '@/hooks/useVision';
import { useImages, useUploadImage, useDeleteImage, useImportImageFromUrl } from '@/hooks/useImages';
import { useSaveVisualGuide } from '@/hooks/useVisualGuides';
import { useToast } from '@/hooks/use-toast.tsx';
import { supabase } from '@/lib/supabase';
import { Loader2, Eye, Sparkles, ArrowRight } from 'lucide-react';
import type { VisualGuideRules, ImageStatus } from '@/types';

export function Visual() {
  const { t } = useTranslation('step-visual');
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: session } = useSession();
  const { data: uploadedImages } = useImages(session?.id || '', 'user');
  const uploadImage = useUploadImage();
  const deleteImage = useDeleteImage();
  const importImageFromUrl = useImportImageFromUrl();
  const saveVisualGuide = useSaveVisualGuide();
  const {
    analyzeImages,
    generateTestImages,
    isAnalyzing,
    analysisError,
    reset
  } = useVisionWithState();

  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [analysisResult, setAnalysisResult] = useState<{
    visual_guide: VisualGuideRules;
    guide_md: string;
  } | null>(null);
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);
  const [isAnalyzingImages, setIsAnalyzingImages] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("upload");

  const handleImagesSelected = async (files: File[]) => {
    if (!session) {
      toast({
        title: 'Error',
        description: 'No active session found.',
        variant: 'destructive',
      });
      return;
    }

    console.log('🖼️ Starting image upload for session:', session.id);
    console.log('📁 Files to upload:', files.length);

    try {
      // Upload each file
      const uploadPromises = files.map(async (file, index) => {
        console.log(`📤 Uploading file ${index + 1}/${files.length}:`, file.name);
        return uploadImage.mutateAsync({
          sessionId: session.id,
          file,
          role: 'user',
        });
      });

      const results = await Promise.all(uploadPromises);
      console.log('✅ All uploads completed:', results.length);

      toast({
        title: 'Images Uploaded',
        description: `${files.length} images uploaded successfully.`,
      });
    } catch (error) {
      console.error('❌ Error uploading images:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload images. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleUrlImport = async (url: string) => {
    if (!session) {
      toast({
        title: 'Error',
        description: 'No active session found.',
        variant: 'destructive',
      });
      return;
    }

    console.log('🔗 Starting URL import for session:', session.id);
    console.log('🌐 URL to import:', url);

    try {
      const result = await importImageFromUrl.mutateAsync({
        sessionId: session.id,
        url,
        role: 'user',
      });

      console.log('✅ URL import completed:', result);

      toast({
        title: 'Image Imported',
        description: 'Image imported successfully from URL.',
      });
    } catch (error) {
      console.error('❌ Error importing image:', error);
      toast({
        title: 'Import Failed',
        description: 'Failed to import image from URL. Please check the URL and try again.',
        variant: 'destructive',
      });
    }
  };

  const handleAnalyzeImages = async () => {
    console.log('🔘 handleAnalyzeImages called from Analysis tab');
    
    if (!session) {
      console.error('❌ No session found');
      return;
    }
    
    if (selectedImages.length === 0) {
      console.error('❌ No images selected');
      toast({
        title: 'No Images Selected',
        description: 'Please upload images first.',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzingImages(true);

    try {
      console.log('📸 Selected images:', selectedImages);
      
      toast({
        title: t('notifications.analyzing.title'),
        description: t('notifications.analyzing.description', { count: selectedImages.length }),
        duration: 10000,
      });

      const result = await analyzeImages(
        selectedImages,
        session.language,
        undefined, // brand context for now
        session.id
      );

      console.log('🎨 ========== ANALYSIS RESULT (Analysis Tab) ==========');
      console.log('📦 Full result object:', JSON.stringify(result, null, 2));
      console.log('✅ Success:', result.success);
      console.log('📊 Has data:', !!result.data);
      console.log('❌ Error:', result.error);
      console.log('🎨 ====================================');

      if (result.success && result.data) {
        console.log('🎉 Analysis succeeded!');
        setAnalysisResult(result.data);
        
        toast({
          variant: 'success',
          title: t('notifications.analysisComplete.title') || 'Analysis Complete! ✨',
          description: t('notifications.analysisComplete.description') || 'Visual brand guidelines generated successfully!',
          duration: 5000,
        });

        // Auto-switch to results tab
        setTimeout(() => {
          console.log('📍 Switching to results tab programmatically');
          setActiveTab('results');
        }, 500);
      } else {
        console.error('❌ Analysis failed:', result.error);
        toast({
          title: t('notifications.analysisFailed.title'),
          description: t('notifications.analysisFailed.description', { error: result.error || t('validation.analysisFailed') }),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('❌ Analysis exception:', error);
      toast({
        title: t('notifications.analysisError.title'),
        description: t('notifications.analysisError.description'),
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzingImages(false);
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

      <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3" id="main-tabs">
          <TabsTrigger value="upload">Upload Images</TabsTrigger>
          <TabsTrigger value="analyze">Analysis</TabsTrigger>
          <TabsTrigger value="results" id="results-tab">Results</TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <ImageDropzone
                onFilesSelected={handleImagesSelected}
                onUrlImport={handleUrlImport}
                isLoading={uploadImage.isPending || importImageFromUrl.isPending}
              />
            </CardContent>
          </Card>

          {/* Uploaded Images Grid */}
          {uploadedImages && uploadedImages.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                 <ImageGrid
                  isAnalyzing={isAnalyzingImages}
                  images={uploadedImages.map(img => {
                    // Get public URL from Supabase
                    const { data: urlData } = supabase.storage
                      .from('kb-builder')
                      .getPublicUrl(img.file_path);
                    
                    return {
                     id: img.id,
                      file: new File([], img.file_path.split('/').pop() || img.file_path),
                      preview: urlData.publicUrl,
                     status: (img.status === "analysed" ? "analyzed" : img.status) as ImageStatus,
                     size: img.size_bytes,
                    };
                  })}
                  onRemove={async (id) => {
                    try {
                      await deleteImage.mutateAsync(id);
                      toast({
                        title: t('notifications.imageRemoved.title'),
                        description: t('notifications.imageRemoved.description'),
                      });
                    } catch (error) {
                      console.error('Failed to delete image:', error);
                      toast({
                        title: t('notifications.deleteFailed.title'),
                        description: t('notifications.deleteFailed.description'),
                        variant: 'destructive',
                      });
                    }
                  }}
                  onAnalyze={async () => {
                    if (!session) {
                      console.error('❌ No session found');
                      return;
                    }
                    
                    console.log('🎨 Starting analysis process...');
                    setIsAnalyzingImages(true);
                    
                    try {
                      // Select all uploaded images for analysis using public URLs
                      const imageUrls = uploadedImages.map(img => {
                        const { data: urlData } = supabase.storage
                          .from('kb-builder')
                          .getPublicUrl(img.file_path);
                        return urlData.publicUrl;
                      });
                      setSelectedImages(imageUrls);
                      
                      console.log('📸 Image URLs:', imageUrls);
                      
                      // Show loading toast
                      toast({
                        title: t('notifications.analyzing.title'),
                        description: t('notifications.analyzing.description', { count: imageUrls.length }),
                        duration: 10000,
                      });
                      
                      console.log('🎨 Calling analyzeImages function...');
                      
                      // Immediately start analysis
                      const result = await analyzeImages(
                        imageUrls,
                        session.language,
                        undefined,
                        session.id
                      );

                      console.log('🎨 ========== ANALYSIS RESULT ==========');
                      console.log('📦 Full result object:', JSON.stringify(result, null, 2));
                      console.log('✅ Success:', result.success);
                      console.log('📊 Has data:', !!result.data);
                      console.log('❌ Error:', result.error);
                      console.log('🎨 ====================================');

                      if (result.success && result.data) {
                        console.log('🎉 ENTERING SUCCESS BLOCK - Analysis succeeded!');
                      } else if (result.success && !result.data) {
                        console.error('⚠️ SUCCESS BUT NO DATA - This should not happen!');
                      } else if (!result.success) {
                        console.error('❌ ENTERING FAILURE BLOCK - Analysis failed!');
                      }

                      if (result.success && result.data) {
                        console.log('✅ Setting analysis result...');
                        setAnalysisResult(result.data);
                        
                        console.log('📣 Showing success toast...');
                        toast({
                          variant: 'success',
                          title: t('notifications.analysisComplete.title') || 'Analysis Complete! ✨',
                          description: t('notifications.analysisComplete.description') || 'Visual brand guidelines generated successfully!',
                          duration: 5000,
                        });
                        
                        // Automatically switch to results tab
                        setTimeout(() => {
                          console.log('📍 Switching to results tab programmatically (from ImageGrid)');
                          setActiveTab('results');
                        }, 500);
                      } else {
                        console.error('❌ Analysis failed:', result.error);
                        toast({
                          title: t('notifications.analysisFailed.title'),
                          description: t('notifications.analysisFailed.description', { error: result.error || t('validation.analysisFailed') }),
                          variant: 'destructive',
                        });
                      }
                    } catch (error) {
                      console.error('❌ Analysis exception:', error);
                      toast({
                        title: t('notifications.analysisError.title'),
                        description: t('notifications.analysisError.description'),
                        variant: 'destructive',
                      });
                    } finally {
                      console.log('🏁 Analysis process complete, resetting state...');
                      setIsAnalyzingImages(false);
                    }
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
                      {selectedImages.map((_url, index) => (
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

