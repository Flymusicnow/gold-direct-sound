import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Mic2, Sparkles, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { FlyMusicLogo } from '@/components/FlyMusicLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import authHero from '@/assets/hero-artist-spotlight.png';
import { useUserAccessState } from '@/hooks/useUserAccessState';

/**
 * /artist/invite - Dedicated invite redemption page for artists.
 * Visual: On stage looking out at audience (artist POV)
 * Flow: Validate code → Create session → Redirect to /join/artist
 * 
 * SUPER CARD: Onboarded artists should NEVER see this page
 */
export default function ArtistInvite() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const codeFromUrl = searchParams.get('code') || '';
  
  const [code, setCode] = useState(codeFromUrl);
  const [loading, setLoading] = useState(false);
  const [validated, setValidated] = useState(false);
  
  const { authenticated, hasArtistAccess, artistOnboarded, loading: accessLoading } = useUserAccessState();

  // SUPER CARD: Redirect authenticated & onboarded artists away
  useEffect(() => {
    if (accessLoading) return;
    
    if (authenticated && hasArtistAccess) {
      if (artistOnboarded) {
        navigate('/studio', { replace: true });
      } else {
        navigate('/studio/onboarding', { replace: true });
      }
    }
  }, [authenticated, hasArtistAccess, artistOnboarded, accessLoading, navigate]);

  // Auto-validate if code is in URL (only if not already authenticated with access)
  useEffect(() => {
    if (codeFromUrl && !validated && !accessLoading && !(authenticated && hasArtistAccess)) {
      handleValidate(codeFromUrl);
    }
  }, [codeFromUrl, validated, accessLoading, authenticated, hasArtistAccess]);

  const handleValidate = async (inviteCode: string) => {
    if (!inviteCode.trim()) {
      toast.error('Please enter an invite code');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-invite-code', {
        body: { code: inviteCode.trim().toUpperCase() }
      });

      if (error || !data?.valid) {
        toast.error(data?.error || 'Invalid or expired invite code');
        setLoading(false);
        return;
      }

      // Store token in localStorage as fallback
      if (data.token) {
        localStorage.setItem('artist_invite_token', data.token);
        localStorage.setItem('artist_invite_expires', data.expires_at);
        if (data.badge_name) {
          localStorage.setItem('artist_invite_badge', data.badge_name);
        }
      }

      setValidated(true);
      toast.success('Invite validated! Redirecting to sign up...');
      
      // Short delay for visual feedback
      setTimeout(() => {
        navigate('/join/artist', { replace: true });
      }, 1000);

    } catch (err) {
      console.error('Invite validation error:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Layer 0: Full-screen background - FIXED */}
      <div className="fixed inset-0 z-0">
        <img
          src={authHero}
          alt="Artist on stage - performer perspective"
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* Layer 1: Dark overlay - FIXED */}
      <div className="fixed inset-0 z-[1] bg-black/70" />

      {/* Header */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-4">
        <button 
          onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/signin/artist')} 
          className="text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Link to="/">
          <FlyMusicLogo size="sm" />
        </Link>
      </div>

      {/* Layer 2: Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-card/95 backdrop-blur-sm rounded-2xl p-8 border border-primary/30 shadow-2xl">
            {/* Header */}
            <div className="text-center space-y-3 mb-8">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <Mic2 className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                You're Invited
              </h1>
              <p className="text-muted-foreground">
                You are here as an <span className="text-primary font-medium">artist</span>
              </p>
            </div>

            {validated ? (
              // Success state
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                </div>
                <p className="text-foreground font-medium">Invite Validated!</p>
                <p className="text-sm text-muted-foreground">Redirecting to create your account...</p>
              </div>
            ) : (
              // Code entry form
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleValidate(code);
                }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label htmlFor="code">Invite Code</Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="FLYMUSIC-XXXX"
                    className="text-center text-lg tracking-wider uppercase border-primary/30 focus:border-primary"
                    autoFocus
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-gold"
                  disabled={loading || !code.trim()}
                >
                  {loading ? 'Validating...' : 'Validate & Continue'}
                </Button>
              </form>
            )}

            {/* Footer note */}
            <div className="mt-8 pt-6 border-t border-border/50 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                <Sparkles className="h-4 w-4 inline mr-1 text-primary" />
                You'll get early access to all studio features
              </p>
              <Link 
                to="/artist" 
                className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                Don't have an invite? Join the waitlist
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
