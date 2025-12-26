import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FlyMusicLogo } from "./FlyMusicLogo";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { RequestBetaDialog } from "./RequestBetaDialog";
import heroImage from "@/assets/hero-artist-spotlight.png";

export function BetaLandingPage() {
  const navigate = useNavigate();
  const [showRequestDialog, setShowRequestDialog] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Layer 1: Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-no-repeat" 
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundPosition: 'center 30%'
        }} 
      />
      
      {/* Layer 2: Gradient overlays for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-black/70 to-black/40" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
      
      {/* Layer 3: Spotlight beams */}
      <div className="spotlight-beam spotlight-center" />
      <div className="spotlight-beam spotlight-left" />
      <div className="spotlight-beam spotlight-right" />
      
      {/* Layer 4: Spotlight glow at convergence */}
      <div className="spotlight-glow" />
      
      {/* Layer 5: Atmospheric haze */}
      <div className="atmospheric-haze" />
      
      {/* Layer 6: Logo at convergence point */}
      <div className="absolute top-[28%] md:top-[30%] left-1/2 -translate-x-1/2 z-10">
        <div className="logo-illuminated">
          <FlyMusicLogo size="xl" />
        </div>
      </div>
      
      {/* Layer 7: Content below logo */}
      <div className="flex-1 flex flex-col items-center justify-end px-4 pb-12 md:pb-20 pt-[55%] md:pt-[45%] relative z-10">
        <div className="max-w-4xl w-full text-center space-y-6">
          {/* Beta Badge */}
          <Badge 
            variant="outline" 
            className="bg-primary/10 text-primary border-primary/30 px-6 py-2 text-sm font-semibold backdrop-blur-sm"
          >
            PRIVATE BETA
          </Badge>

          {/* Hero Text */}
          <div className="space-y-3">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              The New Era of Music
            </h1>
            <p className="text-2xl md:text-5xl text-foreground/90 font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
              Is Here
            </p>
            <p className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] pt-2">
              FlyMusic connects artists directly with fans. No intermediaries. 
              Just real connection, community, and ownership.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button 
              size="lg" 
              onClick={() => navigate("/auth?mode=signin")} 
              className="w-full sm:w-auto min-w-[180px] bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Sign In
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => navigate("/auth?mode=signup")} 
              className="w-full sm:w-auto min-w-[180px] backdrop-blur-sm"
            >
              Create Account
            </Button>
          </div>

          {/* Request Beta Code Button */}
          <div className="pt-4">
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => setShowRequestDialog(true)} 
              className="w-full sm:w-auto min-w-[200px] border-primary/30 text-primary hover:bg-primary/10 backdrop-blur-sm"
            >
              Request Beta Code
            </Button>
          </div>

          {/* Footer Message */}
          <div className="pt-8 text-sm text-muted-foreground">
            <p>Want early access? Sign up and request a beta code.</p>
          </div>
        </div>
      </div>

      {/* Request Beta Dialog */}
      <RequestBetaDialog open={showRequestDialog} onOpenChange={setShowRequestDialog} />
    </div>
  );
}
