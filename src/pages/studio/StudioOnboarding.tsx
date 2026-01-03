import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserAccessState } from "@/hooks/useUserAccessState";
import { useArtistNameAvailability } from "@/hooks/useArtistNameAvailability";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    artistName: "",
    bio: "",
    genre: "",
  });
  const { hasAcceptedRequiredCurrentVersions, loading: legalLoading } = useLegalAcceptance();
  const nameAvailability = useArtistNameAvailability(user?.id);

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

  // Check if legal documents are already accepted (must be before early return)
  useEffect(() => {
    if (legalLoading || accessLoading) return;
    
    const allAccepted = hasAcceptedRequiredCurrentVersions(["user_agreement", "artist_agreement", "privacy_policy"]);
    if (allAccepted && currentStep === 0) {
      setCurrentStep(1);
    }
  }, [hasAcceptedRequiredCurrentVersions, legalLoading, currentStep, accessLoading]);

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
    <div className="min-h-dvh bg-background flex items-center justify-center p-4 pt-20 pb-safe">
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

              <div className="bg-muted/30 rounded-lg p-6 text-center">
                <div className="w-24 h-24 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                  <User className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('studio.onboarding.addLater')}
                </p>
                <Button variant="outline" onClick={() => navigate('/studio/profile')}>
                  {t('studio.onboarding.goToProfile')}
                </Button>
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

              <div className="bg-muted/30 rounded-lg p-6 text-center">
                <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">
                  {t('studio.onboarding.readyUpload')}
                </p>
                <Button variant="outline" onClick={() => navigate('/studio/tracks')}>
                  {t('studio.onboarding.goToTracks')}
                </Button>
              </div>
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

          {/* Actions */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <div className="flex gap-2">
              {currentStep > 1 && (
                <Button variant="ghost" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('studio.onboarding.back')}
                </Button>
              )}
              <Button variant="ghost" onClick={handleSkipAll} className="text-muted-foreground">
                {t('studio.onboarding.skipAll')}
              </Button>
            </div>
            <div className="flex gap-2">
              {currentStep > 1 && currentStep < STEPS.length - 1 && (
                <Button variant="outline" onClick={handleSkip}>
                  {t('studio.onboarding.skipStep')}
                </Button>
              )}
              <Button
                onClick={handleNext}
                className="bg-gradient-gold"
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
