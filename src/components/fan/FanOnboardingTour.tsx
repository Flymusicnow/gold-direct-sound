import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Check, Music, UserPlus, Star, ListMusic, Trophy, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  completed: boolean;
}

export function FanOnboardingTour() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 'discover',
      title: 'Discover Music',
      description: 'Explore personalized recommendations on the Discover page',
      icon: Music,
      completed: false,
    },
    {
      id: 'follow',
      title: 'Follow an Artist',
      description: 'Stay updated on new releases from your favorite artists',
      icon: UserPlus,
      completed: false,
    },
    {
      id: 'spotlight',
      title: 'Vote in Spotlight',
      description: 'Support rising artists by casting your vote',
      icon: Star,
      completed: false,
    },
    {
      id: 'stack',
      title: 'Create a Stack',
      description: 'Organize your favorite tracks into collections',
      icon: ListMusic,
      completed: false,
    },
    {
      id: 'supporter',
      title: 'Earn Supporter XP',
      description: 'Every interaction helps you level up and unlock badges',
      icon: Trophy,
      completed: false,
    },
  ]);

  useEffect(() => {
    if (user) {
      checkOnboardingStatus();
    }
  }, [user]);

  const checkOnboardingStatus = async () => {
    if (!user) return;

    try {
      const { data: progress } = await supabase
        .from('fan_onboarding_progress')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!progress) {
        // First time fan - show onboarding
        setOpen(true);
      } else if (progress.onboarding_completed || progress.onboarding_skipped) {
        // Already completed or skipped
        setOpen(false);
      } else {
        // In progress - show if there are incomplete steps
        const hasIncomplete = !progress.has_visited_discover ||
          !progress.has_followed_artist ||
          !progress.has_voted_spotlight ||
          !progress.has_created_stack ||
          !progress.has_viewed_supporter;

        if (hasIncomplete) {
          setOpen(true);
          updateStepsFromProgress(progress);
        }
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStepsFromProgress = (progress: any) => {
    setSteps(prev => prev.map(step => ({
      ...step,
      completed:
        (step.id === 'discover' && progress.has_visited_discover) ||
        (step.id === 'follow' && progress.has_followed_artist) ||
        (step.id === 'spotlight' && progress.has_voted_spotlight) ||
        (step.id === 'stack' && progress.has_created_stack) ||
        (step.id === 'supporter' && progress.has_viewed_supporter) ||
        false
    })));
  };

  const handleSkip = async () => {
    if (!user) return;

    try {
      await supabase
        .from('fan_onboarding_progress')
        .upsert({
          user_id: user.id,
          onboarding_skipped: true,
        });

      setOpen(false);
      toast.success('You can resume the tour anytime from your dashboard');
    } catch (error) {
      console.error('Error skipping onboarding:', error);
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    try {
      await supabase
        .from('fan_onboarding_progress')
        .upsert({
          user_id: user.id,
          onboarding_completed: true,
        });

      // Trigger celebration confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#E8BF1A', '#F4D67A', '#C89F0A'],
      });

      setOpen(false);
      toast.success('🎉 Welcome to FlyMusic!');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const completedCount = steps.filter(s => s.completed).length;
  const progress = (completedCount / steps.length) * 100;
  const allCompleted = completedCount === steps.length;

  if (loading) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-xl border-primary/20 bg-gradient-to-br from-background to-background/95">
        <button
          onClick={handleSkip}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Skip</span>
        </button>

        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Welcome to FlyMusic
          </DialogTitle>
          <p className="text-center text-muted-foreground">
            Your journey to becoming a legendary fan starts here
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Getting Started</span>
              <span className="font-semibold text-primary">
                {completedCount} / {steps.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Steps Checklist */}
          <div className="space-y-3">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex items-start gap-3 p-4 rounded-lg border transition-all ${
                  step.completed
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border bg-card/50'
                }`}
              >
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    step.completed
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step.completed ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Don't show again checkbox */}
          {!allCompleted && (
            <div className="flex items-center gap-2">
              <Checkbox 
                id="dont-show" 
                checked={dontShowAgain}
                onCheckedChange={(checked) => setDontShowAgain(checked === true)}
              />
              <label htmlFor="dont-show" className="text-sm text-muted-foreground cursor-pointer">
                Don't show this again
              </label>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {allCompleted ? (
              <Button
                onClick={handleComplete}
                className="flex-1 bg-gradient-gold hover:opacity-90 gap-2"
              >
                <Trophy className="h-4 w-4" />
                Complete Tour
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleSkip}
                  variant="outline"
                  className="flex-1"
                >
                  Resume Later
                </Button>
                <Button
                  onClick={async () => {
                    if (dontShowAgain && user) {
                      await supabase
                        .from('fan_onboarding_progress')
                        .upsert({
                          user_id: user.id,
                          onboarding_skipped: true,
                        });
                    }
                    setOpen(false);
                  }}
                  className="flex-1 bg-primary"
                >
                  Let's Go!
                </Button>
              </>
            )}
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Complete steps naturally as you explore the platform
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
