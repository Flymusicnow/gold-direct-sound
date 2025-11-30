import { FlyMusicLogo } from "@/components/FlyMusicLogo";
import { BetaCodeInput } from "@/components/artist/BetaCodeInput";
import { Card } from "@/components/ui/card";
import { Music, Sparkles, TrendingUp, BarChart3, Mail } from "lucide-react";

interface EarlyAccessWallProps {
  onCodeRedeemed: () => void;
}

export function EarlyAccessWall({ onCodeRedeemed }: EarlyAccessWallProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8 space-y-4">
          <div className="flex justify-center mb-6">
            <FlyMusicLogo size="lg" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
            🔒 Early Access Only
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            You're early. FlyMusic is currently in private beta. Use your beta code to unlock full access.
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Left: Why FlyMusic */}
          <Card className="p-6 md:p-8 bg-card border-border">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Why FlyMusic Gold?
            </h2>
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Music className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Build Your Artist Profile</h3>
                  <p className="text-sm text-muted-foreground">
                    Create your professional portfolio with tracks, videos, and exclusive content.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Join FlyMusic Spotlight</h3>
                  <p className="text-sm text-muted-foreground">
                    Compete in fan-driven campaigns and gain visibility with rising artists.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Grow Real Supporters</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect directly with fans who support your music through engagement and subscriptions.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Get Analytics & Feedback</h3>
                  <p className="text-sm text-muted-foreground">
                    Track your growth with detailed insights on plays, likes, followers, and earnings.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Right: Beta Code Input */}
          <Card className="p-6 md:p-8 bg-card border-primary/20 border-2">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Have a Beta Code?
            </h2>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Enter your exclusive beta access code below to unlock the full FlyMusic Gold experience.
              </p>
              
              <BetaCodeInput onSuccess={onCodeRedeemed} />

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground text-center">
                  Code redeemed successfully? The app will unlock automatically.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Footer CTA */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>
              Want early access?{" "}
              <a
                href="mailto:hello@flymusic.se?subject=Beta Access Request"
                className="text-primary hover:underline font-medium"
              >
                Contact us to request an invite
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
