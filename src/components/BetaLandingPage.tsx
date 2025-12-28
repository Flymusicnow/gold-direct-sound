import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Heart, Mic2 } from "lucide-react";
import { FlyMusicLogo } from "./FlyMusicLogo";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { RequestBetaDialog } from "./RequestBetaDialog";
import heroImage from "@/assets/hero-artist-spotlight.png";
export function BetaLandingPage() {
  const navigate = useNavigate();
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  return <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background Image - silhouetted artists with golden spotlights */}
      <div className="absolute inset-0 bg-cover bg-no-repeat" style={{
      backgroundImage: `url(${heroImage})`,
      backgroundPosition: 'center 30%'
    }} />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-black/60 to-black/30" />
      
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-20 relative z-10">
        <div className="max-w-4xl w-full text-center space-y-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <FlyMusicLogo size="xl" />
          </div>

          {/* Beta Badge */}
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 px-6 py-2 text-sm font-semibold">
            PRIVATE BETA
          </Badge>

          {/* Hero Text */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
              The New Era of Music
            </h1>
            <p className="text-2xl text-foreground/80 -mt-2 my-[10px] font-bold md:text-6xl">
              Is Here
            </p>
          <p className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            FlyMusic connects artists directly with fans. No intermediaries. 
            Just real connection, community, and ownership.
          </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            <Button size="lg" onClick={() => navigate("/auth?mode=signin")} className="w-full sm:w-auto min-w-[180px] bg-primary text-primary-foreground hover:bg-primary/90">
              Sign In
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth?mode=signup")} className="w-full sm:w-auto min-w-[180px]">
              Create Account
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/fan")} className="w-full sm:w-auto min-w-[180px] border-pink-500/50 text-pink-400 hover:bg-pink-500/10">
              <Heart className="h-4 w-4 mr-1" />
              Join as Fan
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/artist")} className="w-full sm:w-auto min-w-[180px] border-primary text-primary hover:bg-primary/10">
              <Mic2 className="h-4 w-4 mr-1" />
              Join as Artist
            </Button>
          </div>

          {/* Request Beta Code Button */}
          <div className="pt-6">
            <Button size="lg" variant="outline" onClick={() => setShowRequestDialog(true)} className="w-full sm:w-auto min-w-[200px] border-primary/30 text-primary hover:bg-primary/10">
              Request Beta Code
            </Button>
          </div>

          {/* Quick Navigation Links */}
          <div className="pt-8 flex flex-wrap justify-center gap-4 text-sm">
            <Link to="/how-it-works" className="text-foreground/70 hover:text-primary transition-colors">
              How It Works
            </Link>
            <span className="text-foreground/30">|</span>
            <Link to="/explore" className="text-foreground/70 hover:text-primary transition-colors">
              Explore Artists
            </Link>
            <span className="text-foreground/30">|</span>
            <Link to="/trust" className="text-foreground/70 hover:text-primary transition-colors">
              Trust & Safety
            </Link>
          </div>

          {/* Footer Message */}
          <div className="pt-8 text-sm text-muted-foreground">
            <p>Want early access? Sign up and request a beta code.</p>
          </div>
        </div>
      </div>

      {/* Request Beta Dialog */}
      <RequestBetaDialog open={showRequestDialog} onOpenChange={setShowRequestDialog} />
    </div>;
}