import { useNavigate } from "react-router-dom";
import { FlyMusicLogo } from "@/components/FlyMusicLogo";
import { BetaCodeInput } from "@/components/artist/BetaCodeInput";
import { Card } from "@/components/ui/card";
import { Music, Sparkles, TrendingUp, BarChart3, Mail, Headphones, Heart, Library, Bell } from "lucide-react";

interface EarlyAccessWallProps {
  onCodeRedeemed: () => void;
  userRole: 'artist' | 'fan' | null;
}

const artistBenefits = [
  {
    icon: Music,
    title: "Build Your Artist Profile",
    description: "Create your professional portfolio with tracks, videos, and exclusive content."
  },
  {
    icon: Sparkles,
    title: "Join FlyMusic Spotlight",
    description: "Compete in fan-driven campaigns and gain visibility with rising artists."
  },
  {
    icon: TrendingUp,
    title: "Grow Real Supporters",
    description: "Connect directly with fans who support your music through engagement and subscriptions."
  },
  {
    icon: BarChart3,
    title: "Get Analytics & Feedback",
    description: "Track your growth with detailed insights on plays, likes, followers, and earnings."
  }
];

const fanBenefits = [
  {
    icon: Headphones,
    title: "Discover Rising Artists",
    description: "Explore talent before they blow up and build your perfect music library."
  },
  {
    icon: Heart,
    title: "Support Your Favorites",
    description: "Back artists you love with Supporter Passes and unlock exclusive content."
  },
  {
    icon: Library,
    title: "Build Your Collection",
    description: "Create stacks, save tracks, and curate your personalized listening experience."
  },
  {
    icon: Bell,
    title: "Get Early Access",
    description: "Be first to hear new releases and exclusive drops from artists you follow."
  }
];

export function EarlyAccessWall({ onCodeRedeemed, userRole }: EarlyAccessWallProps) {
  const navigate = useNavigate();

  const handleCodeSuccess = () => {
    onCodeRedeemed();
    // Redirect to role selection after successful code redemption
    navigate('/role-selection');
  };

  // Choose benefits based on user role (default to artist if unknown)
  const benefits = userRole === 'fan' ? fanBenefits : artistBenefits;
  const roleLabel = userRole === 'fan' ? 'Fan' : 'Artist';

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
              Why FlyMusic?
            </h2>
            <div className="space-y-5">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Right: Beta Code Input */}
          <Card className="p-6 md:p-8 bg-card border-primary/20 border-2">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Have a Beta Code?
            </h2>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Enter your exclusive beta access code below to unlock the full FlyMusic experience.
              </p>
              
              <BetaCodeInput onSuccess={handleCodeSuccess} />

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
