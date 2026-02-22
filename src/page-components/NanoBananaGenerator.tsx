"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, X, Play, Download, RefreshCw, AlertTriangle, AlertCircle, CheckCircle, Clock, Zap, Menu, Palette, Wand2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { generateImage, uploadImage, getImageStatus, type GenerateImageRequest, type ImageJobStatus } from '@/services/imageApi';
import { useCredits } from '@/contexts/CreditsContext';
import { useIsMobile } from '@/hooks/use-mobile';
import SidebarTopBar from '@/components/generate/SidebarTopBar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import AuthModal from '@/components/AuthModal';

// Dynamically import components to avoid SSR issues
const Footer = dynamic(() => import("@/components/Footer"), { ssr: false });
const GenerateSidebar = dynamic(() => import("@/components/generate/GenerateSidebar"), { ssr: false });

type FeatureType = 'text-to-image' | 'image-editor';
type ModelType = 'nano-banana' | 'nano-banana-pro';
type TabType = 'nano-banana-pro' | 'text-to-image' | 'image-editor'; // Keep for backward compatibility

interface NanoBananaGeneratorProps {
  defaultTab?: TabType;
}

const CREDIT_COSTS = {
  'text-to-image': {
    'nano-banana': 12,
    'nano-banana-pro': 24,
  },
  'image-editor': {
    'nano-banana': 12,
    'nano-banana-pro': 24,
  },
};

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 10;

const NanoBananaGenerator: React.FC<NanoBananaGeneratorProps> = ({ defaultTab = 'text-to-image' }) => {
  const t = useTranslations('nanoBanana');
  const tNav = useTranslations('navigation');
  const { subscription } = useCredits();
  const { user, isAuthenticated, signOut } = useAuth();
  const isMobile = useIsMobile();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get user display name and initials
  const getUserDisplayName = useCallback(() => {
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  }, [user]);

  const getUserInitials = useCallback(() => {
    const name = getUserDisplayName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }, [getUserDisplayName]);
  
  // Initialize feature and model types from defaultTab
  const getInitialState = (): { featureType: FeatureType; modelType: ModelType } => {
    if (defaultTab === 'image-editor') {
      return { featureType: 'image-editor', modelType: 'nano-banana' };
    } else if (defaultTab === 'nano-banana-pro') {
      return { featureType: 'text-to-image', modelType: 'nano-banana-pro' };
    } else {
      return { featureType: 'text-to-image', modelType: 'nano-banana' };
    }
  };

  const initialState = getInitialState();
  const [featureType, setFeatureType] = useState<FeatureType>(initialState.featureType);
  const [modelType, setModelType] = useState<ModelType>(initialState.modelType);
  
  const [prompt, setPrompt] = useState('');
  const [outputFormat, setOutputFormat] = useState<'png' | 'jpeg'>('png');
  const [imageSize, setImageSize] = useState('1:1');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [resolution, setResolution] = useState<'1K' | '2K' | '4K'>('1K');
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentJob, setCurrentJob] = useState<ImageJobStatus | null>(null);
  const [errors, setErrors] = useState<{ prompt?: string; images?: string }>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const userCredits = subscription?.credits || 0;
  const currentCreditCost = CREDIT_COSTS[featureType][modelType];

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Poll job status
  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      const status = await getImageStatus(jobId);
      setCurrentJob(status);

      if (status.status === 'completed' && status.result_url) {
        setIsGenerating(false);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        toast.success('Image generated successfully!');
      } else if (status.status === 'failed') {
        setIsGenerating(false);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        toast.error(status.error_message || 'Image generation failed');
      }
    } catch (error) {
      console.error('Failed to poll job status:', error);
    }
  }, []);

  // Start polling when job is created
  useEffect(() => {
    if (currentJob?.generation_id && isGenerating) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      pollIntervalRef.current = setInterval(() => {
        pollJobStatus(currentJob.generation_id);
      }, 3000);
    }
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [currentJob?.generation_id, isGenerating, pollJobStatus]);

  const validateFile = async (file: File): Promise<string | null> => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Unsupported file type. Please upload JPEG, PNG, or WebP images.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
      return `File size is too large: ${fileSizeMB}MB. Maximum allowed size is 10MB.`;
    }
    return null;
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);
    const totalFiles = uploadedImages.length + filesArray.length;

    if (totalFiles > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} files allowed`);
      return;
    }

    const validFiles: File[] = [];
    for (const file of filesArray) {
      const error = await validateFile(file);
      if (error) {
        toast.error(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    }

    if (validFiles.length > 0) {
      setUploadedImages(prev => [...prev, ...validFiles]);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(event.target.files);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    handleFileSelect(event.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (uploadedImages.length === 0) return [];

    const urls: string[] = [];
    for (const file of uploadedImages) {
      try {
        const url = await uploadImage(file);
        urls.push(url);
      } catch (error) {
        console.error('Failed to upload image:', error);
        throw error;
      }
    }
    return urls;
  };

  const handleGenerate = async () => {
    // Check authentication
    if (!isAuthenticated) {
      setShowAuthModal(true);
      toast.error('Please login to generate images');
      return;
    }

    // Validate
    const newErrors: { prompt?: string; images?: string } = {};
    if (!prompt.trim()) {
      newErrors.prompt = 'Prompt is required';
    }
    if (featureType === 'image-editor' && uploadedImages.length === 0) {
      newErrors.images = 'At least one image is required for image editor';
    }
    if (userCredits < currentCreditCost) {
      toast.error('Insufficient credits');
      return;
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setIsGenerating(true);
    setCurrentJob(null);

    try {
      // Upload images if needed
      let finalImageUrls = imageUrls;
      if (uploadedImages.length > 0) {
        finalImageUrls = await uploadImages();
        setImageUrls(finalImageUrls);
      }

      // Determine model based on featureType and modelType
      let model: GenerateImageRequest['model'];
      if (featureType === 'text-to-image') {
        if (modelType === 'nano-banana-pro') {
          model = 'nano-banana-pro';
        } else {
          model = 'nano-banana-text-to-image';
        }
      } else {
        // image-editor
        if (modelType === 'nano-banana-pro') {
          model = 'nano-banana-pro';
        } else {
          model = 'nano-banana-image-editor';
        }
      }

      // Build request
      const request: GenerateImageRequest = {
        prompt: prompt.trim(),
        model,
        output_format: outputFormat === 'jpeg' ? 'jpeg' : 'png',
      };

      // Add parameters based on model type
      if (modelType === 'nano-banana-pro') {
        // Pro model uses aspect_ratio and resolution
        request.aspect_ratio = aspectRatio;
        request.resolution = resolution;
        if (finalImageUrls.length > 0) {
          request.image_input = finalImageUrls;
        }
      } else {
        // Basic model
        if (featureType === 'text-to-image') {
          request.image_size = imageSize;
        } else {
          // image-editor basic
          request.aspect_ratio = aspectRatio;
          if (finalImageUrls.length > 0) {
            request.image_input = finalImageUrls;
          }
        }
      }

      // Generate
      const response = await generateImage(request);
      
      // Start polling
      const initialStatus: ImageJobStatus = {
        generation_id: response.jobId,
        status: 'processing',
        progress: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setCurrentJob(initialStatus);
      
      toast.success('Image generation started!');
    } catch (error: any) {
      console.error('Generation error:', error);
      setIsGenerating(false);
      toast.error(error.message || 'Failed to generate image');
    }
  };

  const handleDownload = () => {
    if (currentJob?.result_url) {
      const link = document.createElement('a');
      link.href = currentJob.result_url;
      link.download = `nano-banana-${Date.now()}.${outputFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleReset = () => {
    setPrompt('');
    setUploadedImages([]);
    setImageUrls([]);
    setCurrentJob(null);
    setErrors({});
    setIsGenerating(false);
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GenerateSidebar open={isSidebarOpen} onOpenChange={setIsSidebarOpen} />
      
      <div 
        className="flex-1 transition-all duration-300 bg-background flex flex-col" 
        style={{ marginLeft: mounted && isMobile ? '0' : (mounted ? 'var(--sidebar-width, 240px)' : '240px') }}
      >
        {/* Mobile Menu Button */}
        {mounted && isMobile && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="fixed top-4 left-4 z-40 p-2 rounded-lg bg-background/80 backdrop-blur-sm border border-border shadow-lg hover:bg-muted transition-colors touch-action: manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Open menu"
            style={{ touchAction: 'manipulation' }}
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
        )}
        
        <SidebarTopBar
          isMobile={mounted && isMobile}
          isAuthenticated={isAuthenticated}
          userEmail={user?.email}
          getUserInitials={getUserInitials}
          getUserDisplayName={getUserDisplayName}
          onLogin={() => setShowAuthModal(true)}
          onStart={() => setShowAuthModal(true)}
          onDashboard={() => router.push('/dashboard')}
          onPreferences={() => router.push('/dashboard')}
          onSignOut={() => signOut()}
          labels={{
            login: tNav('login'),
            startForFree: tNav('startForFree'),
            dashboard: tNav('dashboard'),
            preferences: tNav('preferences'),
            signOut: tNav('signOut'),
          }}
        />

        <div className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Panel - Input */}
        <div className="space-y-6">
          <Card className="p-6">
            <Tabs value={featureType} onValueChange={(v) => setFeatureType(v as FeatureType)} className="w-full">
              {/* Feature Selection Group */}
              <div className="mb-6 pb-6 border-b border-border">
                <Label className="mb-3 block text-base font-medium text-foreground">Feature Type</Label>
                <div className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="text-to-image" className="flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      <span>Text-to-Image</span>
                    </TabsTrigger>
                    <TabsTrigger value="image-editor" className="flex items-center gap-2">
                      <Wand2 className="w-4 h-4" />
                      <span>Image Editor</span>
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>

              {/* Model Selection Group */}
              <div className="mb-6">
                <Label className="mb-3 block text-base font-medium text-foreground">Model Selection</Label>
                <RadioGroup value={modelType} onValueChange={(v) => setModelType(v as ModelType)} className="flex gap-4">
                  <div className="flex items-center space-x-2 flex-1 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="nano-banana" id="nano-banana" />
                    <Label htmlFor="nano-banana" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Image src="/images/banana.png" alt="Nano Banana" width={16} height={16} className="w-4 h-4" />
                      <span>Nano Banana</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 flex-1 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="nano-banana-pro" id="nano-banana-pro" />
                    <Label htmlFor="nano-banana-pro" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Image src="/images/banana.png" alt="Nano Banana Pro" width={16} height={16} className="w-4 h-4" />
                      <span>Nano Banana Pro</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Text-to-Image Tab */}
              <TabsContent value="text-to-image" className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">
                    {modelType === 'nano-banana-pro' 
                      ? 'Generate high-quality images with advanced controls.'
                      : 'Generate images from text descriptions.'}
                  </h2>
                  {modelType === 'nano-banana-pro' && (
                    <p className="text-sm text-muted-foreground mb-4">
                      Create professional images with customizable aspect ratios, resolutions, and optional image inputs.
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="prompt-text" className="text-base font-medium">
                    Prompt *
                  </Label>
                  <Textarea
                    id="prompt-text"
                    placeholder="Describe the image you want to generate..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className={`mt-2 min-h-[120px] resize-none ${errors.prompt ? 'border-destructive' : ''}`}
                    maxLength={20000}
                  />
                  <div className="flex justify-between items-center mt-1">
                    {errors.prompt && (
                      <p className="text-sm text-destructive">{errors.prompt}</p>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {prompt.length}/20000
                    </span>
                  </div>
                </div>

                {/* Image Input - Only for nano-banana-pro */}
                {modelType === 'nano-banana-pro' && (
                  <div>
                    <Label className="text-base font-medium">Image Input (Optional)</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Input images to transform or use as reference (supports up to {MAX_FILES} images)
                    </p>
                    {uploadedImages.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {uploadedImages.map((file, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Upload ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-1 right-1 h-6 w-6 p-0"
                              onClick={() => removeImage(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors mt-2 ${
                          dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                        }`}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                      >
                        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Supported formats: JPEG, PNG, WEBP<br />
                          Maximum file size: 10MB<br />
                          Maximum files: {MAX_FILES}
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Select Files
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Aspect Ratio - Only for nano-banana-pro */}
                {modelType === 'nano-banana-pro' ? (
                  <div>
                    <Label className="text-base font-medium">Aspect Ratio</Label>
                    <Select value={aspectRatio} onValueChange={setAspectRatio}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1:1">1:1</SelectItem>
                        <SelectItem value="2:3">2:3</SelectItem>
                        <SelectItem value="3:2">3:2</SelectItem>
                        <SelectItem value="3:4">3:4</SelectItem>
                        <SelectItem value="4:3">4:3</SelectItem>
                        <SelectItem value="4:5">4:5</SelectItem>
                        <SelectItem value="5:4">5:4</SelectItem>
                        <SelectItem value="9:16">9:16</SelectItem>
                        <SelectItem value="16:9">16:9</SelectItem>
                        <SelectItem value="21:9">21:9</SelectItem>
                        <SelectItem value="auto">Auto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div>
                    <Label className="text-base font-medium">Image Size</Label>
                    <Select value={imageSize} onValueChange={setImageSize}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1:1">1:1 (Square)</SelectItem>
                        <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                        <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                        <SelectItem value="3:4">3:4 (Portrait)</SelectItem>
                        <SelectItem value="4:3">4:3 (Landscape)</SelectItem>
                        <SelectItem value="3:2">3:2</SelectItem>
                        <SelectItem value="2:3">2:3</SelectItem>
                        <SelectItem value="5:4">5:4</SelectItem>
                        <SelectItem value="4:5">4:5</SelectItem>
                        <SelectItem value="21:9">21:9</SelectItem>
                        <SelectItem value="auto">Auto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Resolution - Only for nano-banana-pro */}
                {modelType === 'nano-banana-pro' && (
                  <div>
                    <Label className="text-base font-medium">Resolution</Label>
                    <RadioGroup value={resolution} onValueChange={(v) => setResolution(v as '1K' | '2K' | '4K')} className="mt-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="1K" id="1k" />
                        <Label htmlFor="1k">1K</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="2K" id="2k" />
                        <Label htmlFor="2k">2K</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="4K" id="4k" />
                        <Label htmlFor="4k">4K</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                <div>
                  <Label className="text-base font-medium">Output Format</Label>
                  <RadioGroup value={outputFormat} onValueChange={(v) => setOutputFormat(v as 'png' | 'jpeg')} className="mt-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="png" id="png-text" />
                      <Label htmlFor="png-text">PNG</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="jpeg" id="jpeg-text" />
                      <Label htmlFor="jpeg-text">JPEG</Label>
                    </div>
                  </RadioGroup>
                </div>
              </TabsContent>

              {/* Image Editor Tab */}
              <TabsContent value="image-editor" className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">
                    {modelType === 'nano-banana-pro'
                      ? 'Edit and transform your images with AI - Advanced'
                      : 'Edit and transform your images with AI'}
                  </h2>
                  {modelType === 'nano-banana-pro' && (
                    <p className="text-sm text-muted-foreground mb-4">
                      Advanced image editing with customizable aspect ratios and resolutions.
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="prompt-editor" className="text-base font-medium">
                    Prompt *
                  </Label>
                  <Textarea
                    id="prompt-editor"
                    placeholder="Describe how you want to edit the image..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className={`mt-2 min-h-[120px] resize-none ${errors.prompt ? 'border-destructive' : ''}`}
                    maxLength={5000}
                  />
                  <div className="flex justify-between items-center mt-1">
                    {errors.prompt && (
                      <p className="text-sm text-destructive">{errors.prompt}</p>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {prompt.length}/5000
                    </span>
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium">Upload Images *</Label>
                  {errors.images && (
                    <p className="text-sm text-destructive mt-1">{errors.images}</p>
                  )}
                  {uploadedImages.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {uploadedImages.map((file, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-1 right-1 h-6 w-6 p-0"
                            onClick={() => removeImage(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors mt-2 ${
                        dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                      }`}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                    >
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Click to upload images or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supports: JPEG, PNG, WebP<br />
                        Maximum file size: 10MB<br />
                        Maximum files: {MAX_FILES}
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Select Files
                      </Button>
                    </div>
                  )}
                </div>

                {modelType === 'nano-banana-pro' ? (
                  <>
                    <div>
                      <Label className="text-base font-medium">Aspect Ratio</Label>
                      <Select value={aspectRatio} onValueChange={setAspectRatio}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1:1">1:1</SelectItem>
                          <SelectItem value="2:3">2:3</SelectItem>
                          <SelectItem value="3:2">3:2</SelectItem>
                          <SelectItem value="3:4">3:4</SelectItem>
                          <SelectItem value="4:3">4:3</SelectItem>
                          <SelectItem value="4:5">4:5</SelectItem>
                          <SelectItem value="5:4">5:4</SelectItem>
                          <SelectItem value="9:16">9:16</SelectItem>
                          <SelectItem value="16:9">16:9</SelectItem>
                          <SelectItem value="21:9">21:9</SelectItem>
                          <SelectItem value="auto">Auto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-base font-medium">Resolution</Label>
                      <RadioGroup value={resolution} onValueChange={(v) => setResolution(v as '1K' | '2K' | '4K')} className="mt-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="1K" id="1k-editor" />
                          <Label htmlFor="1k-editor">1K</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="2K" id="2k-editor" />
                          <Label htmlFor="2k-editor">2K</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="4K" id="4k-editor" />
                          <Label htmlFor="4k-editor">4K</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </>
                ) : (
                  <div>
                    <Label className="text-base font-medium">Image Size</Label>
                    <Select value={aspectRatio} onValueChange={setAspectRatio}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1:1">1:1 (Square)</SelectItem>
                        <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                        <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                        <SelectItem value="3:4">3:4 (Portrait)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label className="text-base font-medium">Output Format</Label>
                  <RadioGroup value={outputFormat} onValueChange={(v) => setOutputFormat(v as 'png' | 'jpeg')} className="mt-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="png" id="png-editor" />
                      <Label htmlFor="png-editor">PNG</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="jpeg" id="jpeg-editor" />
                      <Label htmlFor="jpeg-editor">JPEG</Label>
                    </div>
                  </RadioGroup>
                </div>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-6">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isGenerating}
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim() || userCredits < currentCreditCost}
                className="flex-1 bg-primary text-primary-foreground"
              >
                {isGenerating ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run · {currentCreditCost} Credits
                  </>
                )}
              </Button>
            </div>

            {/* Credit Info */}
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Available Credits:</span>
                <span className="font-medium flex items-center">
                  <Zap className="w-3 h-3 mr-1" />
                  {userCredits}
                </span>
              </div>
              {userCredits < currentCreditCost && (
                <Alert className="mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Insufficient credits. You need {currentCreditCost} credits to generate.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </Card>
        </div>

        {/* Right Panel - Output */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Output</h3>
            
            {currentJob ? (
              <div className="space-y-4">
                {currentJob.status === 'processing' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Generating...</span>
                      <span className="font-medium">{currentJob.progress}%</span>
                    </div>
                    <Progress value={currentJob.progress} />
                    <p className="text-xs text-center text-muted-foreground">
                      Waiting for generation...
                    </p>
                  </div>
                )}

                {currentJob.status === 'completed' && currentJob.result_url && (
                  <div className="space-y-4">
                    <div className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden">
                      <img
                        src={currentJob.result_url}
                        alt="Generated"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleDownload} className="flex-1">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button variant="outline" className="flex-1" onClick={() => router.push('/dashboard')}>
                        View full history
                      </Button>
                    </div>
                  </div>
                )}

                {currentJob.status === 'failed' && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {currentJob.error_message || 'Image generation failed'}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden">
                  <Image
                    src="/images/example_副本.png"
                    alt="Example output"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
                <p className="text-sm text-center text-muted-foreground">Example output preview</p>
              </div>
            )}
          </Card>
        </div>
      </div>
      </div>
      </div>
      
      {/* Footer */}
      <div style={{ marginLeft: mounted && isMobile ? '0' : (mounted ? 'var(--sidebar-width, 240px)' : '240px') }}>
        <Footer />
      </div>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
};

export default NanoBananaGenerator;
