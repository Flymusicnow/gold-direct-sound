import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserAccessState } from "@/hooks/useUserAccessState";
import { useArtistNameAvailability } from "@/hooks/useArtistNameAvailability";
import { useProfileAvatar } from "@/hooks/useProfileAvatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { AvatarUploadProgress } from "@/components/ui/avatar-upload-progress";
import { Music, Upload, CheckCircle2, User, Image, Share2, ArrowLeft, ArrowRight, FileText, Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { LegalFlow } from "@/components/legal/LegalFlow";
import { useLegalAcceptance } from "@/hooks/useLegalAcceptance";
import { useLanguage } from "@/contexts/LanguageContext";

export default function StudioOnboarding() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { artistOnboarded, loading: accessLoading } = useUserAccessState();
  // Initialize currentStep directly from sessionStorage to prevent race condition
  const [currentStep, setCurrentStep] = useState(() => {
    const saved = sessionStorage.getItem('studio-onboarding-step');
    if (saved) {
      const step = parseInt(saved, 10);
      if (!isNaN(step) && step > 0) {
        return step;
      }
    }
    return 0;
  });
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(() => {
    const saved = sessionStorage.getItem('studio-onboarding-draft');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { artistName: "", bio: "", genre: "" };
      }
    }
    return { artistName: "", bio: "", genre: "" };
  });
  const { hasAcceptedRequiredCurrentVersions, loading: legalLoading } = useLegalAcceptance();
  const nameAvailability = useArtistNameAvailability(user?.id);
  
  // Avatar upload state for step 2
  const [avatarUploaded, setAvatarUploaded] = useState(false);
  const [artistProfileId, setArtistProfileId] = useState<string | null>(null);
  
  // Track upload state for step 3
  const [trackTitle, setTrackTitle] = useState("");
  const [trackFile, setTrackFile] = useState<File | null>(null);
  const [trackUploading, setTrackUploading] = useState(false);
  const [trackUploaded, setTrackUploaded] = useState(false);
  const [trackDragActive, setTrackDragActive] = useState(false);

  // Fetch artist profile ID after step 1
  useEffect(() => {
    if (user && currentStep >= 2) {
      supabase
        .from('artist_profiles')
        .select('id, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setArtistProfileId(data.id);
            if (data.avatar_url) setAvatarUploaded(true);
          }
        });
    }
  }, [user, currentStep]);

  // Avatar uploader hook
  const avatarUploader = useProfileAvatar({
    profileType: 'artist',
    profileId: artistProfileId || undefined,
    userId: user?.id || '',
    onSuccess: () => setAvatarUploaded(true),
  });

  // Track upload handlers
  const handleTrackDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTrackDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('audio/')) {
      setTrackFile(file);
      if (!trackTitle) {
        setTrackTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    } else {
      toast.error(t('studio.onboarding.pleaseDropAudio'));
    }
  };

  const handleTrackFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTrackFile(file);
      if (!trackTitle) {
        setTrackTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleTrackUpload = async () => {
    if (!trackFile || !user || !artistProfileId) return;
    
    setTrackUploading(true);
    try {
      const audioPath = `${user.id}/${Date.now()}_${trackFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { error: uploadError } = await supabase.storage
        .from('tracks')
        .upload(audioPath, trackFile);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('tracks')
        .getPublicUrl(audioPath);
      
      const { error: insertError } = await supabase.from('tracks').insert({
        artist_id: artistProfileId,
        title: trackTitle || trackFile.name.replace(/\.[^/.]+$/, ""),
        audio_url: publicUrl,
      });
      
      if (insertError) throw insertError;
      
      // Update onboarding progress
      await supabase
        .from("artist_onboarding_progress")
        .update({ has_uploaded_track: true })
        .eq("user_id", user.id);
      
      setTrackUploaded(true);
      toast.success(t('studio.onboarding.trackUploadedSuccess'));
    } catch (error: any) {
      toast.error(error.message || t('studio.onboarding.uploadError'));
    } finally {
      setTrackUploading(false);
    }
  };

  const STEPS = [
    { id: 0, title: t('studio.onboarding.steps.terms'), icon: FileText, description: t('studio.onboarding.steps.termsDesc') },
    { id: 1, title: t('studio.onboarding.steps.basicInfo'), icon: User, description: t('studio.onboarding.steps.basicInfoDesc') },
    { id: 2, title: t('studio.onboarding.steps.profilePicture'), icon: Image, description: t('studio.onboarding.steps.profilePictureDesc') },
    { id: 3, title: t('studio.onboarding.steps.firstUpload'), icon: Upload, description: t('studio.onboarding.steps.firstUploadDesc') },
    { id: 4, title: t('studio.onboarding.steps.goLive'), icon: Share2, description: t('studio.onboarding.steps.goLiveDesc') },
  ];

  // Guard: If already onboarded, redirect to studio immediately
  useEffect(() => {
    if (!accessLoading && artistOnboarded) {
      navigate('/studio', { replace: true });
    }
  }, [accessLoading, artistOnboarded, navigate]);

  // Check if legal documents are already accepted - only advance to step 1 if on step 0
  useEffect(() => {
    if (legalLoading || accessLoading) return;
    
    const allAccepted = hasAcceptedRequiredCurrentVersions(["user_agreement", "artist_agreement", "privacy_policy"]);
    // Only advance if we're still on legal step (0) and legal is already accepted
    if (allAccepted && currentStep === 0) {
      setCurrentStep(1);
    }
  }, [hasAcceptedRequiredCurrentVersions, legalLoading, currentStep, accessLoading]);

  // Save form data to sessionStorage
  useEffect(() => {
    if (formData.artistName || formData.bio || formData.genre) {
      sessionStorage.setItem('studio-onboarding-draft', JSON.stringify(formData));
    }
  }, [formData]);

  // Save current step to sessionStorage
  useEffect(() => {
    if (currentStep > 0) {
      sessionStorage.setItem('studio-onboarding-step', String(currentStep));
    }
  }, [currentStep]);

  // Show loading while checking onboarding status
  if (accessLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background pt-20 pb-safe">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  const progress = ((currentStep) / (STEPS.length - 1)) * 100;

  const handleLegalComplete = async () => {
    // Ensure onboarding progress record exists so we can track the user
    if (user) {
      await supabase
        .from('artist_onboarding_progress')
        .upsert({
          user_id: user.id,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
    }
    setCurrentStep(1);
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!formData.artistName) {
        toast.error(t('studio.onboarding.enterArtistName'));
        return;
      }
      
      setLoading(true);
      try {
        // Check if profile already exists
        const { data: existing } = await supabase
          .from('artist_profiles')
          .select('id')
          .eq('user_id', user!.id)
          .maybeSingle();

        if (existing) {
          // Update existing profile
          const { error } = await supabase
            .from('artist_profiles')
            .update({
              artist_name: formData.artistName,
              bio: formData.bio || null,
              genre: formData.genre || null,
            })
            .eq('user_id', user!.id);

          if (error) throw error;
        } else {
          // Create new profile
          const { error } = await supabase
            .from('artist_profiles')
            .insert({
              user_id: user!.id,
              artist_name: formData.artistName,
              bio: formData.bio || null,
              genre: formData.genre || null,
              status: 'approved',
            });

          if (error) throw error;
        }
        
        setCurrentStep(2);
      } catch (error: any) {
        console.error('Error saving profile:', error);
        toast.error(error.message || t('studio.onboarding.saveProfileError'));
      } finally {
        setLoading(false);
      }
    } else if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding - PERSIST BEFORE NAVIGATION
      setLoading(true);
      try {
        if (user) {
          await supabase
            .from('artist_onboarding_progress')
            .upsert({
              user_id: user.id,
              onboarding_completed: true,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
        }
        // Clear sessionStorage on completion
        sessionStorage.removeItem('studio-onboarding-draft');
        sessionStorage.removeItem('studio-onboarding-step');
        toast.success(t('studio.onboarding.welcomeSuccess'));
        navigate('/studio', { replace: true });
      } catch (error) {
        console.error('Error completing onboarding:', error);
        toast.error(t('studio.onboarding.saveError'));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate('/studio');
    }
  };

  const handleSkipAll = async () => {
    if (user) {
      await supabase
        .from('artist_onboarding_progress')
        .upsert({
          user_id: user.id,
          onboarding_skipped: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
    }
    navigate('/studio', { replace: true });
  };

  // Show legal flow for step 0
  if (currentStep === 0) {
    return (
      <LegalFlow 
        userType="artist"
        onComplete={handleLegalComplete}
      >
        <Card className="w-full max-w-md p-8 text-center mb-6">
          <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">{t('studio.onboarding.welcome')}</h1>
          <p className="text-muted-foreground">
            {t('studio.onboarding.legalIntro')}
          </p>
        </Card>
      </LegalFlow>
    );
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center p-4 pt-20 pb-20 overflow-y-auto">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Music className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">{t('studio.onboarding.welcome')}</h1>
          </div>
          <p className="text-muted-foreground">
            {t('studio.onboarding.completeProfile').replace('{count}', String(STEPS.length - 1))}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {t('studio.onboarding.stepOf').replace('{current}', String(currentStep)).replace('{total}', String(STEPS.length - 1))}
            </span>
            <span className="text-sm font-medium text-primary">
              {t('studio.onboarding.percentComplete').replace('{percent}', String(Math.round(progress)))}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-between mb-8 px-4">
          {STEPS.slice(1).map((step, index) => {
            const actualId = step.id;
            const isCompleted = currentStep > actualId;
            const isCurrent = currentStep === actualId;
            const StepIcon = step.icon;
            
            return (
              <div key={step.id} className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                    isCompleted && "bg-primary text-primary-foreground",
                    isCurrent && "bg-primary/20 text-primary ring-2 ring-primary",
                    !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <StepIcon className="h-5 w-5" />
                  )}
                </div>
                <span className={cn(
                  "text-xs mt-2 hidden md:block",
                  isCurrent ? "text-primary font-medium" : "text-muted-foreground"
                )}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <Card className="p-8">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{t('studio.onboarding.basicInformation')}</h2>
                  <p className="text-sm text-muted-foreground">{t('studio.onboarding.tellFans')}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="artistName">{t('studio.onboarding.artistNameLabel')}</Label>
                  <div className="relative">
                    <Input
                      id="artistName"
                      value={formData.artistName}
                      onChange={(e) => {
                        setFormData({ ...formData, artistName: e.target.value });
                        nameAvailability.checkAvailability(e.target.value);
                      }}
                      placeholder={t('studio.onboarding.artistNamePlaceholder')}
                      className="mt-2 pr-10"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 mt-1">
                      {nameAvailability.isChecking && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      {!nameAvailability.isChecking && nameAvailability.isAvailable === true && formData.artistName.length >= 2 && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {!nameAvailability.isChecking && nameAvailability.isAvailable === false && (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </div>
                  {nameAvailability.isAvailable === false && (
                    <p className="text-sm text-destructive mt-1">{t('studio.onboarding.artistNameTaken')}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="genre">{t('studio.onboarding.genreLabel')}</Label>
                  <Input
                    id="genre"
                    value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                    placeholder={t('studio.onboarding.genrePlaceholder')}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="bio">{t('studio.onboarding.bioLabel')}</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder={t('studio.onboarding.bioPlaceholder')}
                    className="mt-2 min-h-24"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Image className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{t('studio.onboarding.profilePictureTitle')}</h2>
                  <p className="text-sm text-muted-foreground">{t('studio.onboarding.addPhoto')}</p>
                </div>
              </div>

              {/* Inline Avatar Upload */}
              <div className="flex flex-col items-center">
                <AvatarUploadProgress
                  currentUrl={avatarUploaded ? undefined : null}
                  fallback={formData.artistName?.charAt(0).toUpperCase() || "A"}
                  size="xl"
                  uploading={avatarUploader.uploading}
                  progress={avatarUploader.progress}
                  onFileSelect={avatarUploader.handleFileSelect}
                  onDrop={avatarUploader.handleDrop}
                  onDragOver={avatarUploader.handleDragOver}
                  onDragLeave={avatarUploader.handleDragLeave}
                  dragActive={avatarUploader.dragActive}
                />
                
                <div 
                  onDrop={avatarUploader.handleDrop}
                  onDragOver={avatarUploader.handleDragOver}
                  onDragLeave={avatarUploader.handleDragLeave}
                  className={cn(
                    "mt-6 w-full border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                    avatarUploader.dragActive 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">
                    {t('studio.onboarding.dragDropImage')}
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    {t('studio.onboarding.supportedFormats')}
                  </p>
                  <label className="inline-block">
                    <Button variant="outline" size="sm" asChild>
                      <span>{t('studio.onboarding.chooseFile')}</span>
                    </Button>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={avatarUploader.handleFileSelect}
                      disabled={avatarUploader.uploading}
                    />
                  </label>
                  
                  {avatarUploader.uploading && (
                    <p className="text-sm text-primary mt-3">
                      {t('studio.onboarding.uploading')} {avatarUploader.progress}%
                    </p>
                  )}
                  
                  {avatarUploaded && !avatarUploader.uploading && (
                    <p className="text-sm text-green-500 mt-3 flex items-center justify-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      {t('studio.onboarding.imageUploaded')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{t('studio.onboarding.uploadFirstTrack')}</h2>
                  <p className="text-sm text-muted-foreground">{t('studio.onboarding.shareMusic')}</p>
                </div>
              </div>

              {!trackUploaded ? (
                <>
                  {/* Track Title Input */}
                  {trackFile && (
                    <div>
                      <Label htmlFor="trackTitle">{t('studio.onboarding.trackTitle')}</Label>
                      <Input
                        id="trackTitle"
                        value={trackTitle}
                        onChange={(e) => setTrackTitle(e.target.value)}
                        placeholder={t('studio.onboarding.trackTitlePlaceholder')}
                        className="mt-2"
                      />
                    </div>
                  )}
                  
                  {/* Drag & Drop Zone */}
                  <div 
                    onDrop={handleTrackDrop}
                    onDragOver={(e) => { e.preventDefault(); setTrackDragActive(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setTrackDragActive(false); }}
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                      trackDragActive 
                        ? "border-primary bg-primary/5" 
                        : trackFile 
                          ? "border-green-500/50 bg-green-500/5" 
                          : "border-border hover:border-primary/50"
                    )}
                  >
                    {trackFile ? (
                      <>
                        <Music className="h-8 w-8 mx-auto mb-3 text-green-500" />
                        <p className="text-sm font-medium">{trackFile.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {(trackFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => setTrackFile(null)}
                        >
                          {t('studio.onboarding.removeFile')}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Music className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                        <p className="text-sm font-medium mb-1">
                          {t('studio.onboarding.dragDropAudio')}
                        </p>
                        <p className="text-xs text-muted-foreground mb-3">
                          MP3, WAV, FLAC, AAC
                        </p>
                        <label className="inline-block">
                          <Button variant="outline" size="sm" asChild>
                            <span>{t('studio.onboarding.chooseFile')}</span>
                          </Button>
                          <input
                            type="file"
                            accept="audio/*"
                            className="hidden"
                            onChange={handleTrackFileSelect}
                          />
                        </label>
                      </>
                    )}
                  </div>
                  
                  {/* Upload Button */}
                  {trackFile && (
                    <Button 
                      onClick={handleTrackUpload}
                      disabled={trackUploading}
                      className="w-full"
                    >
                      {trackUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t('studio.onboarding.uploading')}
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          {t('studio.onboarding.uploadTrack')}
                        </>
                      )}
                    </Button>
                  )}
                </>
              ) : (
                <div className="bg-green-500/10 rounded-lg p-6 text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                  <p className="font-medium text-green-500">
                    {t('studio.onboarding.trackUploadedSuccess')}
                  </p>
                </div>
              )}
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{t('studio.onboarding.youreAllSet')}</h2>
                  <p className="text-sm text-muted-foreground">{t('studio.onboarding.profileReady')}</p>
                </div>
              </div>

              <div className="bg-muted/30 rounded-lg p-6 space-y-4">
                <h3 className="font-semibold">{t('studio.onboarding.onboardingChecklist')}</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    {t('studio.onboarding.termsAccepted')}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    {t('studio.onboarding.basicProfileInfo')}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-4 w-4 rounded-full border border-muted-foreground" />
                    {t('studio.onboarding.profilePictureOptional')}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-4 w-4 rounded-full border border-muted-foreground" />
                    {t('studio.onboarding.firstTrackOptional')}
                  </li>
                </ul>
                
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">{t('studio.onboarding.nextSteps')}</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• {t('studio.onboarding.uploadTracksVideos')}</li>
                    <li>• {t('studio.onboarding.customizeProfile')}</li>
                    <li>• {t('studio.onboarding.shareWithFans')}</li>
                    <li>• {t('studio.onboarding.applyVerification')}</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Actions - Responsive layout for mobile */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-8 pt-6 border-t">
            <div className="flex flex-wrap gap-2 justify-start">
              {currentStep > 1 && (
                <Button variant="ghost" onClick={handleBack} size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('studio.onboarding.back')}
                </Button>
              )}
              <Button variant="ghost" onClick={handleSkipAll} className="text-muted-foreground" size="sm">
                {t('studio.onboarding.skipAll')}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              {currentStep > 1 && currentStep < STEPS.length - 1 && (
                <Button variant="outline" onClick={handleSkip} size="sm">
                  {t('studio.onboarding.skipStep')}
                </Button>
              )}
              <Button
                onClick={handleNext}
                className="bg-gradient-gold"
                size="sm"
                disabled={loading || (currentStep === 1 && nameAvailability.isAvailable === false)}
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {loading ? t('studio.onboarding.saving') : currentStep === STEPS.length - 1 ? t('studio.onboarding.goToStudio') : t('studio.onboarding.next')}
                {!loading && currentStep < STEPS.length - 1 && <ArrowRight className="h-4 w-4 ml-2" />}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
