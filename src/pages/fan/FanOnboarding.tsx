import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, Music, Sparkles, CheckCircle2, Award, Trophy, Star, FileText } from "lucide-react";
import { LegalFlow } from "@/components/legal/LegalFlow";
import { useLegalAcceptance } from "@/hooks/useLegalAcceptance";

export default function FanOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0 = legal, 1 = features, 2 = complete
  const { hasAcceptedRequiredCurrentVersions, loading: legalLoading } = useLegalAcceptance();

  // Check if legal documents are already accepted
  useEffect(() => {
    if (legalLoading) return;
    
    const allAccepted = hasAcceptedRequiredCurrentVersions(["user_agreement", "privacy_policy"]);
    if (allAccepted) {
      setStep(1);
    }
  }, [hasAcceptedRequiredCurrentVersions, legalLoading]);

  const handleLegalComplete = () => {
    setStep(1);
  };

  const handleContinue = () => {
    if (step === 1) {
      setStep(2);
    } else {
      navigate('/fan/feed');
    }
  };

  const handleSkip = () => {
    navigate('/fan/feed');
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
          <h1 className="text-2xl font-bold mb-2">Welcome to FlyMusic</h1>
          <p className="text-muted-foreground">
            Before we continue, please review and accept our terms.
          </p>
        </Card>
      </LegalFlow>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Welcome to FlyMusic</h1>
          </div>
          <p className="text-muted-foreground">
            Discover music and support artists directly
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
                  <h2 className="text-xl font-bold">What You Can Do</h2>
                  <p className="text-sm text-muted-foreground">Explore FlyMusic features</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30">
                  <Music className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Discover New Music</h3>
                    <p className="text-sm text-muted-foreground">
                      Find tracks from emerging artists and trending content
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30">
                  <Heart className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Follow & Support Artists</h3>
                    <p className="text-sm text-muted-foreground">
                      Build your library and earn XP by supporting your favorites
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30">
                  <Sparkles className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Vote in Spotlight</h3>
                    <p className="text-sm text-muted-foreground">
                      Help artists rise by voting in community-driven campaigns
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
                  <h2 className="text-xl font-bold">You're All Set!</h2>
                  <p className="text-sm text-muted-foreground">Start exploring now</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-muted/30 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <Heart className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">Get Started:</h3>
                      <ul className="text-sm text-muted-foreground space-y-2">
                        <li>• Browse the Discover feed for personalized recommendations</li>
                        <li>• Follow your first artist to unlock achievements</li>
                        <li>• Create stacks (playlists) to organize your favorite tracks</li>
                        <li>• Vote in active Spotlight campaigns</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-sm">Unlock Achievements</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col items-center gap-1 p-2 rounded bg-background/50">
                      <Trophy className="h-4 w-4 text-primary" />
                      <span className="text-xs text-muted-foreground text-center">First Follow</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-2 rounded bg-background/50">
                      <Star className="h-4 w-4 text-primary" />
                      <span className="text-xs text-muted-foreground text-center">First Vote</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-2 rounded bg-background/50">
                      <Music className="h-4 w-4 text-primary" />
                      <span className="text-xs text-muted-foreground text-center">First Stack</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button variant="ghost" onClick={handleSkip}>
              Skip for now
            </Button>
            <Button
              onClick={handleContinue}
              className="bg-gradient-gold"
            >
              {step === 1 ? "Continue" : "Start Exploring"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
