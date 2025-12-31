import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Headphones, Sparkles, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { FlyMusicLogo } from '@/components/FlyMusicLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import fanHero from '@/assets/fan-hero-concert.png';
import { useUserAccessState } from '@/hooks/useUserAccessState';

/**
 * /fan/invite - Dedicated invite redemption page for fans.
 * Visual: Audience perspective looking at stage (fan POV)
 * Flow: Validate code → Create session → Redirect to /join/fan
 * 
 * SUPER CARD: Onboarded fans should NEVER see this page
 */
export default function FanInvite() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const codeFromUrl = searchParams.get('code') || '';
  
  const [code, setCode] = useState(codeFromUrl);
  const [loading, setLoading] = useState(false);
  const [validated, setValidated] = useState(false);
  
  const { authenticated, hasFanAccess, fanOnboarded, loading: accessLoading } = useUserAccessState();

  // SUPER CARD: Redirect authenticated & onboarded fans away
  useEffect(() => {
    if (accessLoading) return;
    
    if (authenticated && hasFanAccess) {
      if (fanOnboarded) {
        navigate('/fan/feed', { replace: true });
      } else {
        navigate('/fan/onboarding', { replace: true });
      }
    }
  }, [authenticated, hasFanAccess, fanOnboarded, accessLoading, navigate]);

  // Auto-validate if code is in URL (only if not already authenticated with access)
  useEffect(() => {
    if (codeFromUrl && !validated && !accessLoading && !(authenticated && hasFanAccess)) {
      handleValidate(codeFromUrl);
    }
  }, [codeFromUrl, validated, accessLoading, authenticated, hasFanAccess]);

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

      // Store token and invite_id in localStorage for account creation
      if (data.token) {
        localStorage.setItem('fan_invite_token', data.token);
        localStorage.setItem('fan_invite_expires', data.expires_at);
        if (data.badge_name) {
          localStorage.setItem('fan_invite_badge', data.badge_name);
        }
        if (data.invite_id) {
          localStorage.setItem('fan_invite_id', data.invite_id);
        }
      }

      setValidated(true);
      toast.success('Invite validated! Redirecting to sign up...');
      
      // Short delay for visual feedback
      setTimeout(() => {
        navigate('/join/fan', { replace: true });
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
          src={fanHero}
          alt="Concert crowd - audience perspective"
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* Layer 1: Dark overlay - FIXED */}
      <div className="fixed inset-0 z-[1] bg-black/70" />

      {/* Header */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-4">
        <button 
          onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/signin/fan')} 
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
          <div className="bg-card/95 backdrop-blur-sm rounded-2xl p-8 border border-border shadow-2xl">
            {/* Header */}
            <div className="text-center space-y-3 mb-8">
              <div className="mx-auto w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center">
                <Headphones className="h-8 w-8 text-violet-400" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                You're Invited
              </h1>
              <p className="text-muted-foreground">
                You are here as a <span className="text-violet-400 font-medium">fan</span>
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
                    className="text-center text-lg tracking-wider uppercase"
                    autoFocus
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-violet-600 hover:bg-violet-700"
                  disabled={loading || !code.trim()}
                >
                  {loading ? 'Validating...' : 'Validate & Continue'}
                </Button>
              </form>
            )}

            {/* Footer note */}
            <div className="mt-8 pt-6 border-t border-border/50 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                <Sparkles className="h-4 w-4 inline mr-1" />
                You'll get early access features and a special badge
              </p>
              <Link 
                to="/fan" 
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
