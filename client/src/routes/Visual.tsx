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
import { useSaveDocument } from '@/hooks/useDocuments';
import { useToast } from '@/hooks/use-toast.tsx';
import { supabase } from '@/lib/supabase';
import { Loader2, Eye, Sparkles, ArrowRight } from 'lucide-react';
import type { VisualGuideRules, ImageStatus } from '@/types';

export function Visual() {
  const { t } = useTranslation('step-visual');
  const { t: tCommon } = useTranslation('common');
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: session } = useSession();
  const { data: uploadedImages } = useImages(session?.id || '', 'user');
  const uploadImage = useUploadImage();
  const deleteImage = useDeleteImage();
  const importImageFromUrl = useImportImageFromUrl();
  const saveVisualGuide = useSaveVisualGuide();
  const saveDocument = useSaveDocument();
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
  const [generatedTestImages, setGeneratedTestImages] = useState<Array<{ url: string; storage_path: string }>>([]);

  const handleImagesSelected = async (files: File[]) => {
    if (!session) {
      toast({
        title: tCommon('notifications.error.title'),
        description: tCommon('notifications.error.noSession'),
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
        title: tCommon('toast.upload.success.title'),
        description: tCommon('toast.upload.success.description', { count: files.length }),
      });
    } catch (error) {
      console.error('❌ Error uploading images:', error);
      toast({
        title: tCommon('toast.upload.failed.title'),
        description: tCommon('toast.upload.failed.description'),
        variant: 'destructive',
      });
    }
  };

  const handleUrlImport = async (url: string) => {
    if (!session) {
      toast({
        title: tCommon('notifications.error.title'),
        description: tCommon('notifications.error.noSession'),
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
        title: tCommon('toast.upload.imported.title'),
        description: tCommon('toast.upload.imported.description'),
      });
    } catch (error) {
      console.error('❌ Error importing image:', error);
      toast({
        title: tCommon('toast.upload.importFailed.title'),
        description: tCommon('toast.upload.importFailed.description'),
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
        title: tCommon('toast.upload.noImages.title'),
        description: tCommon('toast.upload.noImages.description'),
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

    // Create a comprehensive prompt using the visual guidelines
    const guidelines = analysisResult.visual_guide;
    
    // Build a rich prompt from the analysis
    // Extract subject matter and context from types_of_images
    const firstImageType = guidelines.types_of_images[0];
    const subjectMatter = firstImageType?.subject_matter || firstImageType?.examples[0] || 'Professional photography';
    const context = firstImageType?.context || 'Professional setting';
    
    const basePrompt = `
Professional brand photography: ${subjectMatter} in ${context}

Subject & Context:
- What to show: ${subjectMatter}
- Setting: ${context}
- Category: ${firstImageType?.category_name || 'Brand imagery'}

Style Direction:
- Lighting: ${guidelines.style_direction.lighting}
- Color: ${guidelines.style_direction.colour}
- Composition: ${guidelines.style_direction.composition}
- Format: ${guidelines.style_direction.format}

Color Palette:
- Primary: ${guidelines.palette.primary.join(', ')}
- Secondary: ${guidelines.palette.secondary.join(', ')}

Producer Notes:
- Camera: ${guidelines.producer_notes.camera}
- Lighting: ${guidelines.producer_notes.lighting}
- Angle: ${guidelines.producer_notes.angle}
- Scene: ${guidelines.producer_notes.scene}

Key Guidelines:
${guidelines.prompting_guidance.join('\n')}
    `.trim();

    // Combine negative aspects from variation rules
    const negativePrompt = 'artificial, staged, overly processed, low quality, cluttered, inconsistent branding';

    console.log('🎨 ========== IMAGE GENERATION PROMPT ==========');
    console.log('📝 Base Prompt:', basePrompt);
    console.log('❌ Negative Prompt:', negativePrompt);
    console.log('📊 Full Guidelines:', JSON.stringify(guidelines, null, 2));
    console.log('🎨 ===============================================');

    const result = await generateTestImages(
      basePrompt,
      negativePrompt,
      2,
      session.id
    );

    setIsGeneratingTest(false);

    if (result.success && result.data) {
      setGeneratedTestImages(result.data);
      toast({
        variant: 'success',
        title: tCommon('toast.generation.testImages.title'),
        description: tCommon('toast.generation.testImages.description', { count: result.data.length }),
      });
    } else {
      toast({
        title: tCommon('toast.generation.failed.title'),
        description: result.error || tCommon('toast.generation.failed.description'),
        variant: 'destructive',
      });
    }
  };

  const handleSaveGuidelines = async () => {
    if (!analysisResult || !session) return;

    try {
      // Save the visual guide rules (JSON)
      await saveVisualGuide.mutateAsync({
        sessionId: session.id,
        rules_json: analysisResult.visual_guide,
      });

      // Also save the markdown document to kb_documents
      await saveDocument.mutateAsync({
        sessionId: session.id,
        docType: 'visual',
        content_md: analysisResult.guide_md,
        title: 'Visual Brand Guidelines',
        status: 'approved',
      });

      toast({
        variant: 'success',
        title: t('notifications.guidelinesSaved.title'),
        description: t('notifications.guidelinesSaved.description'),
      });

      navigate('/export');
    } catch (error) {
      toast({
        title: t('notifications.saveFailed.title'),
        description: t('notifications.saveFailed.description'),
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
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-xl sm:text-2xl witfy-text-gradient flex items-center gap-2">
            <Eye className="w-5 h-5 sm:w-6 sm:h-6" />
            {t('title')}
          </CardTitle>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t('subtitle')}
          </p>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <p className="text-xs sm:text-sm text-muted-foreground mb-4">
            {t('description')}
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3" id="main-tabs">
          <TabsTrigger value="upload">{t('tabs.upload')}</TabsTrigger>
          <TabsTrigger value="analyze">{t('tabs.analyze')}</TabsTrigger>
          <TabsTrigger value="results" id="results-tab">{t('tabs.results')}</TabsTrigger>
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
                    <p className="text-sm font-medium mb-2">{t('analysis.selectedImages', { count: selectedImages.length })}</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedImages.map((_url, index) => (
                        <Badge key={index} variant="secondary">
                          {t('analysis.imageNumber', { number: index + 1 })}
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
                  <p>{t('analysis.noImagesSelected')}</p>
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
                  {t('actions.tryAgain')}
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
                    {t('analysis.visualGuidelines')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="palette" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="palette">{t('analysis.tabs.colors')}</TabsTrigger>
                      <TabsTrigger value="style">{t('analysis.tabs.style')}</TabsTrigger>
                      <TabsTrigger value="guidelines">{t('analysis.tabs.guidelines')}</TabsTrigger>
                      <TabsTrigger value="producer">{t('analysis.tabs.producer')}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="palette" className="mt-4">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">{t('analysis.sections.palette.primary')}</h4>
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
                          <h4 className="font-semibold mb-2">{t('analysis.sections.palette.secondary')}</h4>
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
                          <h4 className="font-semibold mb-2">{t('analysis.sections.palette.neutrals')}</h4>
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
                      <div className="space-y-6">
                        <div>
                          <h4 className="font-semibold mb-3">{t('analysis.sections.generalPrinciples.title')}</h4>
                          <ul className="space-y-2">
                            {analysisResult.visual_guide.general_principles.map((principle: string, index: number) => (
                              <li key={index} className="text-sm text-muted-foreground">• {principle}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold mb-2">{t('analysis.sections.styleDirection.lighting')}</h4>
                            <p className="text-sm text-muted-foreground">
                              {analysisResult.visual_guide.style_direction.lighting}
                            </p>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">{t('analysis.sections.styleDirection.colour')}</h4>
                            <p className="text-sm text-muted-foreground">
                              {analysisResult.visual_guide.style_direction.colour}
                            </p>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">{t('analysis.sections.styleDirection.composition')}</h4>
                            <p className="text-sm text-muted-foreground">
                              {analysisResult.visual_guide.style_direction.composition}
                            </p>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">{t('analysis.sections.styleDirection.format')}</h4>
                            <p className="text-sm text-muted-foreground">
                              {analysisResult.visual_guide.style_direction.format}
                            </p>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-3">{t('analysis.sections.peopleEmotions.title')}</h4>
                          <ul className="space-y-2">
                            {analysisResult.visual_guide.people_and_emotions.map((item: string, index: number) => (
                              <li key={index} className="text-sm text-muted-foreground">• {item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="guidelines" className="mt-4">
                      <div className="space-y-6">
                        <div>
                          <h4 className="font-semibold mb-3">{t('analysis.sections.typesOfImages.title')}</h4>
                          {analysisResult.visual_guide.types_of_images.map((category, catIndex) => (
                            <div key={catIndex} className="mb-4">
                              <h5 className="font-medium text-sm mb-2 text-witfy-600">{category.category_name}</h5>
                              <ul className="space-y-1">
                                {category.examples.map((example: string, exIndex: number) => (
                                  <li key={exIndex} className="text-sm text-muted-foreground">• {example}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>

                        <div>
                          <h4 className="font-semibold mb-3">{t('analysis.sections.neuroTriggers.title')}</h4>
                          <ul className="space-y-2">
                            {analysisResult.visual_guide.neuro_triggers.map((trigger: string, index: number) => (
                              <li key={index} className="text-sm text-muted-foreground">• {trigger}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-3">{t('analysis.sections.variationRules.title')}</h4>
                          <ul className="space-y-2">
                            {analysisResult.visual_guide.variation_rules.map((rule: string, index: number) => (
                              <li key={index} className="text-sm text-muted-foreground">• {rule}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-3">{t('analysis.sections.promptingGuidance.title')}</h4>
                          <ul className="space-y-2">
                            {analysisResult.visual_guide.prompting_guidance.map((guidance: string, index: number) => (
                              <li key={index} className="text-sm text-muted-foreground">• {guidance}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="producer" className="mt-4">
                      <div className="space-y-6">
                        <div className="bg-witfy-50 p-4 rounded-lg border border-witfy-200">
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <span className="text-2xl">📷</span>
                            {t('analysis.sections.producer.camera')}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {analysisResult.visual_guide.producer_notes.camera}
                          </p>
                        </div>

                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <span className="text-2xl">💡</span>
                            {t('analysis.sections.producer.lighting')}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {analysisResult.visual_guide.producer_notes.lighting}
                          </p>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <span className="text-2xl">📐</span>
                            {t('analysis.sections.producer.angle')}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {analysisResult.visual_guide.producer_notes.angle}
                          </p>
                        </div>

                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <span className="text-2xl">🎬</span>
                            {t('analysis.sections.producer.scene')}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {analysisResult.visual_guide.producer_notes.scene}
                          </p>
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

                  {/* Display Generated Test Images */}
                  {generatedTestImages.length > 0 && (
                    <div className="mt-6 space-y-4">
                      <h4 className="font-semibold text-sm">{t('analysis.generatedTestImages')}</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {generatedTestImages.map((img, idx) => (
                          <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                            <img
                              src={img.url}
                              alt={`Generated test image ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
                <p>{t('analysis.noResults')}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

