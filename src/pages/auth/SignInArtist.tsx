import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mic2, ArrowLeft } from "lucide-react";
import { RequestBetaDialog } from "@/components/RequestBetaDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FlyMusicLogo } from "@/components/FlyMusicLogo";
import TrustBadge from "@/components/trust/TrustBadge";
import authHero from "@/assets/auth-hero-concert.png";

export default function SignInArtist() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showBetaDialog, setShowBetaDialog] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Account not found. Request a beta code to create an account.", {
            action: {
              label: "Request Code",
              onClick: () => setShowBetaDialog(true),
            },
          });
        } else {
          toast.error(error.message);
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        // Check if user has artist role
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id);
        
        const hasArtist = roles?.some(r => r.role === 'artist');
        
        if (!hasArtist) {
          // User doesn't have artist role - WRONG ROLE, show clear error
          const hasFan = roles?.some(r => r.role === 'fan');
          const hasBrand = roles?.some(r => r.role === 'brand');
          
          await supabase.auth.signOut();
          
          if (hasFan) {
            // Clear error: This area is for Artists
            toast.error('This area is for Artists. You have a Fan account.', {
              action: {
                label: 'Sign in as Fan',
                onClick: () => navigate('/signin/fan'),
              },
              duration: 6000,
            });
          } else if (hasBrand) {
            toast.error('This area is for Artists. You have a Brand account.', {
              action: {
                label: 'Sign in as Brand',
                onClick: () => navigate('/signin/brand'),
              },
              duration: 6000,
            });
          } else {
            toast.error('No Artist account found for this email.');
          }
          setLoading(false);
          return;
        }

        // Artist role confirmed - check beta access and onboarding status
        const { data: artistAccess } = await supabase
          .from('artist_beta_access')
          .select('id')
          .eq('user_id', data.user.id)
          .maybeSingle();

        toast.success(t('auth.signInSuccess'));
        
        if (artistAccess) {
          // Has beta access - check onboarding status
          const { data: onboarding } = await supabase
            .from('artist_onboarding_progress')
            .select('onboarding_completed')
            .eq('user_id', data.user.id)
            .maybeSingle();
          
          if (onboarding?.onboarding_completed) {
            navigate('/studio', { replace: true });
          } else {
            navigate('/studio/onboarding', { replace: true });
          }
        } else {
          // No beta access - go to gate/waitlist
          navigate('/artist', { replace: true });
        }
      }
    } catch (err) {
      console.error('Sign in error:', err);
      toast.error(t('errors.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Minimal header - logo + trust badge (desktop only) */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Link to="/">
          <FlyMusicLogo size="sm" />
        </Link>
        <TrustBadge />
      </div>

      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 pt-20">
        <div className="w-full max-w-md space-y-8">

          <Card className="border-primary/20 animate-fade-in">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Mic2 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">{t('auth.signInArtistTitle')}</CardTitle>
              <CardDescription>{t('auth.signInArtistDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.artistEmailLabel')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="artist@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-gradient-gold" disabled={loading}>
                  {loading ? t('common.loading') : t('auth.signInAsArtist')}
                </Button>
              </form>

              {/* Create Account Section */}
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-foreground font-medium mb-2">New to FlyMusic?</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Got a beta code? Create your artist account.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/artist/invite')}
                    className="w-full"
                  >
                    Create Account (Beta)
                  </Button>
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  No code yet?{' '}
                  <button
                    type="button"
                    onClick={() => setShowBetaDialog(true)}
                    className="text-primary hover:underline"
                  >
                    Request Beta Access
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right side - Hero image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src={authHero}
          alt="Artist performing"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
      </div>

      <RequestBetaDialog 
        open={showBetaDialog} 
        onOpenChange={setShowBetaDialog}
        fixedRole="artist"
      />
    </div>
  );
}
