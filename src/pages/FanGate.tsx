import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Headphones, Heart, Library, Bell, Sparkles } from 'lucide-react';
import { FlyMusicLogo } from '@/components/FlyMusicLogo';
import { WaitlistForm } from '@/components/fan/WaitlistForm';
import { InviteCodeUnlock } from '@/components/fan/InviteCodeUnlock';
import { toast } from 'sonner';
import fanHero from '@/assets/fan-hero-concert.png';

const fanBenefits = [
  {
    icon: Headphones,
    title: 'Discover New Artists',
    description: 'Find emerging talent before anyone else.'
  },
  {
    icon: Heart,
    title: 'Support Your Favorites',
    description: 'Build XP and earn recognition for your engagement.'
  },
  {
    icon: Library,
    title: 'Create Stacks',
    description: 'Curate and share your favorite tracks.'
  },
  {
    icon: Bell,
    title: 'Never Miss a Drop',
    description: 'Get notified when artists you follow release new music.'
  },
  {
    icon: Sparkles,
    title: 'Vote in Spotlight',
    description: 'Help rising artists get discovered through fan-driven campaigns.'
  }
];

export default function FanGate() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === '1';
  const reason = searchParams.get('reason');

  // Show toast when redirected from /signin/fan without invite access
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
          src={fanHero}
          alt="Concert crowd"
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
      <div className="absolute top-6 left-6 z-20">
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
            Join as Fan
          </h1>
          <p className="text-lg text-white/80">
            Discover and support artists from day one.
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
          <WaitlistForm disabled={isPreview} />
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
            {fanBenefits.map((benefit, index) => (
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
            to="/signin/fan" 
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
