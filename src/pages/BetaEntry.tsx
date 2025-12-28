import { useNavigate, Link } from 'react-router-dom';
import { Mic2, Heart, ArrowLeft } from 'lucide-react';
import { FlyMusicLogo } from '@/components/FlyMusicLogo';
import { InviteCodeUnlock } from '@/components/fan/InviteCodeUnlock';
import { Badge } from '@/components/ui/badge';
import heroImage from '@/assets/hero-music.jpg';

export default function BetaEntry() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <img
          src={heroImage}
          alt="Music background"
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* Dark overlay */}
      <div className="fixed inset-0 z-[1] bg-black/70" />

      {/* Header */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)} 
          className="text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Link to="/">
          <FlyMusicLogo size="sm" />
        </Link>
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-xl mx-auto space-y-8 text-center">
          {/* Badge */}
          <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
            PRIVATE BETA
          </Badge>

          {/* Hero text */}
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Join the Beta
            </h1>
            <p className="text-lg text-white/80">
              Choose your path to early access.
            </p>
          </div>

          {/* Two primary CTAs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Fan card */}
            <div 
              onClick={() => navigate('/fan')}
              className="bg-card rounded-xl p-6 border border-border cursor-pointer hover:border-primary/50 transition-all group"
            >
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">I'm a Fan</h3>
              <p className="text-sm text-muted-foreground">Discover and support artists</p>
            </div>

            {/* Artist card */}
            <div 
              onClick={() => navigate('/artist')}
              className="bg-card rounded-xl p-6 border border-border cursor-pointer hover:border-primary/50 transition-all group"
            >
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <Mic2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">I'm an Artist</h3>
              <p className="text-sm text-muted-foreground">Upload and share music</p>
            </div>
          </div>

          {/* Invite code section */}
          <div className="pt-4 border-t border-white/10">
            <p className="text-sm text-white/60 mb-4">Already have an invite code?</p>
            <InviteCodeUnlock />
          </div>

          {/* Footer note */}
          <p className="text-sm text-white/50">
            We're onboarding in waves during our private beta.
          </p>
        </div>
      </div>
    </div>
  );
}
