import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Sparkles, Upload, Video, Share2, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface OnboardingProgress {
  has_uploaded_track: boolean;
  has_uploaded_video: boolean;
  has_shared_profile: boolean;
  onboarding_completed: boolean;
  onboarding_skipped: boolean;
}

export function ArtistOnboardingDialog() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [showDialog, setShowDialog] = useState(false);
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only show for users with artist role
    if (user && hasRole('artist')) {
      checkOnboardingStatus();
    } else {
      setLoading(false);
    }
  }, [user, hasRole]);

  const checkOnboardingStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("artist_onboarding_progress")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Create initial onboarding record
        const { data: newProgress, error: insertError } = await supabase
          .from("artist_onboarding_progress")
          .insert({ user_id: user.id })
          .select()
          .single();

        if (insertError) throw insertError;
        setProgress(newProgress);
        setShowDialog(true);
      } else {
        setProgress(data);
        // Show dialog if onboarding not completed and not skipped
        if (!data.onboarding_completed && !data.onboarding_skipped) {
          setShowDialog(true);
        }
      }
    } catch (error) {
      console.error("Error checking onboarding:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!user) return;

    try {
      await supabase
        .from("artist_onboarding_progress")
        .update({ onboarding_skipped: true })
        .eq("user_id", user.id);

      setShowDialog(false);
      toast.success("You can resume onboarding anytime!");
    } catch (error) {
      console.error("Error skipping onboarding:", error);
    }
  };

  const handleComplete = async () => {
    if (!user || !progress) return;

    try {
      await supabase
        .from("artist_onboarding_progress")
        .update({ onboarding_completed: true })
        .eq("user_id", user.id);

      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#E8BF1A", "#F4D67A", "#C89F0A"],
      });

      toast.success("Welcome to FlyMusic Gold! 🎉");
      setShowDialog(false);
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }
  };

  if (loading || !progress) return null;

  const steps = [
    {
      icon: Upload,
      label: "Upload your first track",
      tooltip: "Supported formats: MP3, WAV, FLAC (max 50MB). Add cover art for better presentation and engagement.",
      completed: progress.has_uploaded_track,
      action: () => navigate("/studio/tracks"),
    },
    {
      icon: Video,
      label: "Upload your first video",
      tooltip: "Upload MP4 or WebM videos (max 40MB). Videos autoplay muted in fan feeds for better discovery.",
      completed: progress.has_uploaded_video,
      action: () => navigate("/studio/videos"),
    },
    {
      icon: Share2,
      label: "Share your artist profile",
      tooltip: "Copy your artist link and share on social media. Add ?ref=yourname to track where traffic comes from.",
      completed: progress.has_shared_profile,
      action: () => toast.info("Use the share button on your profile!"),
    },
  ];

  const allCompleted = steps.every((step) => step.completed);

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="sm:max-w-md border-primary/20">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Welcome to FlyMusic Gold</DialogTitle>
              <DialogDescription className="text-base">
                Your Creative Control Room
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Complete these steps to get started:
          </p>

          <div className="space-y-3">
            {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <button
                    key={index}
                    onClick={step.action}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 rounded-lg border transition-all",
                      step.completed
                        ? "border-primary/30 bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    {step.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    )}
                    <Icon className={cn(
                      "h-5 w-5 flex-shrink-0",
                      step.completed ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className={cn(
                      "text-sm font-medium flex-1 text-left",
                      step.completed ? "text-primary" : "text-foreground"
                    )}>
                      {step.label}
                    </span>
                    <Tooltip>
                      <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <button className="text-muted-foreground hover:text-primary transition-colors">
                          <HelpCircle className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-[250px] border-primary/20">
                        <p className="text-xs">{step.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </button>
                );
              })}
          </div>

          {allCompleted && (
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 text-center">
              <p className="text-sm font-medium text-primary mb-3">
                🎉 All steps completed!
              </p>
              <Button
                onClick={handleComplete}
                className="bg-gradient-gold hover:opacity-90 w-full"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Finish Onboarding
              </Button>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="flex-1"
          >
            Skip for now
          </Button>
          {!allCompleted && (
            <Button
              onClick={() => steps.find(s => !s.completed)?.action()}
              className="flex-1 bg-gradient-gold hover:opacity-90"
            >
              Let's Go! ✨
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
