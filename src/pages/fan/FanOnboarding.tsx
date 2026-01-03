import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, Music, Sparkles, CheckCircle2, Award, Trophy, Star, FileText } from "lucide-react";
import { LegalFlow } from "@/components/legal/LegalFlow";
import { useLegalAcceptance } from "@/hooks/useLegalAcceptance";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

export default function FanOnboarding() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(() => {
    const savedStep = sessionStorage.getItem('fan-onboarding-step');
    if (savedStep) {
      const s = parseInt(savedStep, 10);
      if (!isNaN(s) && s > 0) return s;
    }
    return 0;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { hasAcceptedRequiredCurrentVersions, loading: legalLoading } = useLegalAcceptance();

  // Check if legal documents are already accepted
  useEffect(() => {
    if (legalLoading) return;
    
    const allAccepted = hasAcceptedRequiredCurrentVersions(["user_agreement", "privacy_policy"]);
    if (allAccepted && step === 0) {
      setStep(1);
    }
  }, [hasAcceptedRequiredCurrentVersions, legalLoading, step]);

  // Save step to sessionStorage
  useEffect(() => {
    if (step > 0) {
      sessionStorage.setItem('fan-onboarding-step', String(step));
    }
  }, [step]);

  const handleLegalComplete = () => {
    setStep(1);
  };

  const handleContinue = async () => {
    if (step === 1) {
      setStep(2);
    } else {
      // Persist onboarding completion before navigation
      if (user && !isSubmitting) {
        setIsSubmitting(true);
        try {
          await supabase
            .from('fan_onboarding_progress')
            .upsert({
              user_id: user.id,
              onboarding_completed: true,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
        } catch (error) {
          console.error('Failed to save onboarding progress:', error);
        }
        setIsSubmitting(false);
      }
      sessionStorage.removeItem('fan-onboarding-step');
      navigate('/fan/feed', { replace: true });
    }
  };

  const handleSkip = async () => {
    // Persist skip state before navigation
    if (user && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await supabase
          .from('fan_onboarding_progress')
          .upsert({
            user_id: user.id,
            onboarding_skipped: true,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
      } catch (error) {
        console.error('Failed to save onboarding skip:', error);
      }
      setIsSubmitting(false);
    }
    sessionStorage.removeItem('fan-onboarding-step');
    navigate('/fan/feed', { replace: true });
  };

  // Show legal flow
  if (step === 0) {
    return (
      <LegalFlow 
        userType="fan"
        onComplete={handleLegalComplete}
      >
        <Card className="w-full max-w-md p-8 text-center mb-6">
          <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">{t('fan.onboarding.welcome')}</h1>
          <p className="text-muted-foreground">
            {t('fan.onboarding.legalIntro')}
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
            <Heart className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">{t('fan.onboarding.welcome')}</h1>
          </div>
          <p className="text-muted-foreground">
            {t('fan.onboarding.discoverSubtitle')}
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`h-2 w-16 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`h-2 w-16 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
        </div>

        {/* Step Content */}
        <Card className="p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Music className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{t('fan.onboarding.whatYouCanDo')}</h2>
                  <p className="text-sm text-muted-foreground">{t('fan.onboarding.exploreFeatures')}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30">
                  <Music className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">{t('fan.onboarding.discoverNewMusic')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('fan.onboarding.discoverDescription')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30">
                  <Heart className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">{t('fan.onboarding.followSupport')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('fan.onboarding.followDescription')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30">
                  <Sparkles className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">{t('fan.onboarding.voteSpotlight')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('fan.onboarding.voteDescription')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{t('fan.onboarding.youreAllSet')}</h2>
                  <p className="text-sm text-muted-foreground">{t('fan.onboarding.startExploringNow')}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-muted/30 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <Heart className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">{t('fan.onboarding.getStarted')}</h3>
                      <ul className="text-sm text-muted-foreground space-y-2">
                        <li>• {t('fan.onboarding.browseDiscover')}</li>
                        <li>• {t('fan.onboarding.followFirst')}</li>
                        <li>• {t('fan.onboarding.createStacks')}</li>
                        <li>• {t('fan.onboarding.voteActive')}</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-sm">{t('fan.onboarding.unlockAchievements')}</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col items-center gap-1 p-2 rounded bg-background/50">
                      <Trophy className="h-4 w-4 text-primary" />
                      <span className="text-xs text-muted-foreground text-center">{t('fan.onboarding.firstFollow')}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-2 rounded bg-background/50">
                      <Star className="h-4 w-4 text-primary" />
                      <span className="text-xs text-muted-foreground text-center">{t('fan.onboarding.firstVote')}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-2 rounded bg-background/50">
                      <Music className="h-4 w-4 text-primary" />
                      <span className="text-xs text-muted-foreground text-center">{t('fan.onboarding.firstStack')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button variant="ghost" onClick={handleSkip} disabled={isSubmitting}>
              {t('fan.onboarding.skipForNow')}
            </Button>
            <Button
              onClick={handleContinue}
              className="bg-gradient-gold"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('fan.onboarding.saving') : step === 1 ? t('fan.onboarding.continue') : t('fan.onboarding.startExploring')}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
