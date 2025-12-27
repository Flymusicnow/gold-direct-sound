import { useNavigate } from "react-router-dom";
import { FlyMusicLogo } from "@/components/FlyMusicLogo";
import { BetaCodeInput } from "@/components/artist/BetaCodeInput";
import { Card } from "@/components/ui/card";
import { Mail, Headphones, Heart, Library, Bell } from "lucide-react";
import fanHero from "@/assets/fan-hero-concert.png";

interface EarlyAccessWallProps {
  onCodeRedeemed: () => void;
}

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

export function EarlyAccessWall({ onCodeRedeemed }: EarlyAccessWallProps) {
  const navigate = useNavigate();

  const handleCodeSuccess = () => {
    onCodeRedeemed();
    // Redirect to role selection after successful code redemption
    navigate('/role-selection');
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Full-screen background */}
      <div className="absolute inset-0">
        <img
          src={fanHero}
          alt="Concert crowd"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/70" />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto">
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
          <Card className="p-6 md:p-8 bg-card/95 backdrop-blur-sm border-border">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Why FlyMusic?
            </h2>
            <div className="space-y-5">
              {fanBenefits.map((benefit, index) => (
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
          <Card className="p-6 md:p-8 bg-card/95 backdrop-blur-sm border-primary/20 border-2">
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
