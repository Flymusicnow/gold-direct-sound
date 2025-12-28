import { useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Upload, Users, TrendingUp, Sparkles, DollarSign, ArrowLeft } from 'lucide-react';
import { FlyMusicLogo } from '@/components/FlyMusicLogo';
import { WaitlistForm } from '@/components/fan/WaitlistForm';
import { InviteCodeUnlock } from '@/components/fan/InviteCodeUnlock';
import { toast } from 'sonner';
import authHero from '@/assets/auth-hero-concert.png';

const artistBenefits = [
  {
    icon: Upload,
    title: 'Upload Your Music',
    description: 'Share tracks and videos with your growing fanbase.'
  },
  {
    icon: Users,
    title: 'Build Your Audience',
    description: 'Connect directly with superfans who support you.'
  },
  {
    icon: TrendingUp,
    title: 'Early Access Tools',
    description: 'Get analytics, promo tools, and merch before public launch.'
  },
  {
    icon: Sparkles,
    title: 'Spotlight Campaigns',
    description: 'Get discovered through fan-driven promotion.'
  },
  {
    icon: DollarSign,
    title: 'Own Your Earnings',
    description: 'Keep more of what you earn. No middlemen.'
  }
];

export default function ArtistGate() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === '1';
  const reason = searchParams.get('reason');

  // Show toast when redirected from /signin/artist without invite access
  useEffect(() => {
    if (reason === 'invite-required') {
      toast.info('Sign in is invite-only. Enter an invite code to continue.');
      // Clear the param to prevent repeat toasts on refresh
      searchParams.delete('reason');
      setSearchParams(searchParams, { replace: true });
    }
  }, [reason, searchParams, setSearchParams]);

  return (
    <div className="min-h-screen relative">
      {/* Layer 0: Full-screen background - FIXED */}
      <div className="fixed inset-0 z-0">
        <img
          src={authHero}
          alt="Artist on stage"
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* Layer 1: Dark overlay - FIXED */}
      <div className="fixed inset-0 z-[1] bg-black/60" />

      {/* Preview mode banner */}
      {isPreview && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-black text-center py-2 text-sm font-medium">
          PREVIEW MODE — Forms are disabled
        </div>
      )}

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

      {/* Layer 2: Main content - relative with high z-index */}
      <div className={`relative z-10 min-h-screen flex items-center justify-center p-4 ${isPreview ? 'pt-16' : ''}`}>
      <div className="w-full max-w-lg mx-auto space-y-8">
        {/* Hero text */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Join as Artist
          </h1>
          <p className="text-lg text-white/80">
            Upload music, build your fanbase, and own your career.
          </p>
        </div>

        {/* Primary CTA: Waitlist */}
        <div className="bg-card rounded-xl p-6 border border-border space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-1">
              Get Early Access
            </h2>
            <p className="text-sm text-muted-foreground">
              Join the waitlist and we'll invite you when it's your turn.
            </p>
          </div>
          <WaitlistForm disabled={isPreview} defaultArtist />
        </div>

        {/* Secondary CTA: Invite code */}
        <div className="flex justify-center">
          <InviteCodeUnlock disabled={isPreview} />
        </div>

        {/* Benefits */}
        <div className="bg-card rounded-xl p-6 border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Why FlyMusic?
          </h3>
          <div className="space-y-4">
            {artistBenefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{benefit.title}</p>
                  <p className="text-xs text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-sm text-white/60">
          Invite-only beta. We onboard in waves.
        </p>

        {/* Already have account link */}
        <div className="text-center">
          <Link 
            to="/signin/artist" 
            className="text-sm text-white/70 hover:text-white transition-colors underline underline-offset-4"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </div>
      </div>
    </div>
  );
}
