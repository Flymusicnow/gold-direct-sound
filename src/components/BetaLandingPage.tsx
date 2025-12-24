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
      {/* Background Image - silhouetted artists with golden spotlights */}
      <div 
        className="absolute inset-0 bg-cover bg-no-repeat"
        style={{ 
          backgroundImage: `url(${heroImage})`,
          backgroundPosition: 'center 30%'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-black/60 to-black/30" />
      
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-20 relative z-10">
        <div className="max-w-4xl w-full text-center space-y-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <FlyMusicLogo size="lg" />
          </div>

          {/* Beta Badge */}
          <Badge 
            variant="outline" 
            className="bg-primary/10 text-primary border-primary/30 px-6 py-2 text-sm font-semibold"
          >
            PRIVATE BETA
          </Badge>

          {/* Hero Text */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
              The New Era of Music
            </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            FlyMusic connects artists directly with fans. No intermediaries. 
            Just real connection, community, and ownership.
          </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
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
              className="w-full sm:w-auto min-w-[180px]"
            >
              Create Account
            </Button>
          </div>

          {/* Request Beta Code Button */}
          <div className="pt-6">
            <Button
              size="lg"
              variant="outline"
              onClick={() => setShowRequestDialog(true)}
              className="w-full sm:w-auto min-w-[200px] border-primary/30 text-primary hover:bg-primary/10"
            >
              Request Beta Code
            </Button>
          </div>

          {/* Footer Message */}
          <div className="pt-12 text-sm text-muted-foreground">
            <p>Want early access? Sign up and request a beta code.</p>
          </div>
        </div>
      </div>

      {/* Request Beta Dialog */}
      <RequestBetaDialog open={showRequestDialog} onOpenChange={setShowRequestDialog} />
    </div>
  );
}
