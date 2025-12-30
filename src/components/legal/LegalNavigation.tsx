import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FlyMusicLogo } from "@/components/FlyMusicLogo";
import TrustBadge from "@/components/trust/TrustBadge";

export function LegalNavigation() {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left: Back button */}
        <Button 
          variant="ghost" 
          onClick={handleBack} 
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        
        {/* Center: Logo + Trust */}
        <div className="flex items-center gap-3">
          <Link to="/">
            <FlyMusicLogo size="md" />
          </Link>
          <TrustBadge />
        </div>
        
        {/* Right: Empty for balance */}
        <div className="w-20" />
      </div>
    </nav>
  );
}
