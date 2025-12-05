import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, ArrowRight, Music, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import confetti from "canvas-confetti";

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { hasRole, refreshProfile } = useAuth();
  const [planName, setPlanName] = useState<string>("Premium");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fire gold confetti on mount
    const colors = ['#E8BF1A', '#FFD700', '#DAA520'];
    
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors
    });

    // Second burst
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors
      });
    }, 250);
  }, []);

  useEffect(() => {
    const verifySubscription = async () => {
      try {
        // Refresh subscription status
        const { data, error } = await supabase.functions.invoke('check-subscription');
        
        if (!error && data?.plan_key) {
          const planNames: Record<string, string> = {
            artist_pro: "Artist Pro",
            artist_elite: "Artist Elite",
            fan_supporter: "Supporter Pass"
          };
          setPlanName(planNames[data.plan_key] || "Premium");
        }
        
        // Refresh user profile to get updated subscription status
        await refreshProfile();
      } catch (err) {
        console.error("Error verifying subscription:", err);
      } finally {
        setIsLoading(false);
      }
    };

    verifySubscription();
  }, [refreshProfile]);

  const isArtist = hasRole('artist');
  const dashboardPath = isArtist ? '/studio' : '/fan';
  const dashboardLabel = isArtist ? 'Go to Studio' : 'Go to Fan Portal';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Success Icon */}
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto animate-in zoom-in-50 duration-500">
            <CheckCircle className="w-12 h-12 text-primary" />
          </div>
          <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-primary animate-pulse" />
        </div>

        {/* Success Message */}
        <div className="space-y-2 animate-in fade-in-50 slide-in-from-bottom-4 duration-500 delay-200">
          <h1 className="text-3xl font-bold">Welcome to {planName}!</h1>
          <p className="text-muted-foreground">
            Your subscription is now active. Thank you for supporting FlyMusic!
          </p>
        </div>

        {/* Plan Card */}
        <Card className="border-primary/20 bg-primary/5 animate-in fade-in-50 slide-in-from-bottom-4 duration-500 delay-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              {isArtist ? (
                <Music className="w-6 h-6 text-primary" />
              ) : (
                <User className="w-6 h-6 text-primary" />
              )}
              <span className="text-lg font-semibold">{planName}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {isArtist 
                ? "Unlock unlimited uploads, advanced analytics, and premium features."
                : "Enjoy 2x XP, exclusive content, and priority access."
              }
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3 animate-in fade-in-50 slide-in-from-bottom-4 duration-500 delay-400">
          <Button 
            onClick={() => navigate(dashboardPath)} 
            className="w-full"
            size="lg"
          >
            {dashboardLabel}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')} 
            className="w-full"
          >
            Return to Home
          </Button>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-muted-foreground animate-in fade-in-50 duration-500 delay-500">
          A confirmation email has been sent to your inbox. You can manage your subscription in Settings.
        </p>
      </div>
    </div>
  );
}
