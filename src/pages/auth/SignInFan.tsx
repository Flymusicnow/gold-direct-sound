import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, ArrowLeft, Loader2 } from "lucide-react";
import { LanguageToggle } from "@/components/LanguageToggle";
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
import fanHero from "@/assets/fan-hero-concert.png";

export default function SignInFan() {
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
          toast.error(t('auth.invalidCredentials'), {
            description: t('auth.invalidCredentialsDescription'),
            action: {
              label: t('auth.forgotPassword'),
              onClick: () => navigate('/forgot-password'),
            },
          });
        } else {
          toast.error(error.message);
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        // Check if user has fan role
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id);
        
        const hasFan = roles?.some(r => r.role === 'fan');
        
        if (!hasFan) {
          // User doesn't have fan role - WRONG ROLE, show clear error
          const hasArtist = roles?.some(r => r.role === 'artist');
          const hasBrand = roles?.some(r => r.role === 'brand');
          
          await supabase.auth.signOut();
          
          if (hasArtist) {
            // Clear error: This area is for Fans
            toast.error(t('auth.wrongRoleFan'), {
              action: {
                label: t('auth.signInAsArtist'),
                onClick: () => navigate('/signin/artist'),
              },
              duration: 6000,
            });
          } else if (hasBrand) {
            toast.error(t('auth.wrongRoleFan'), {
              action: {
                label: t('auth.signInAsBrand'),
                onClick: () => navigate('/signin/brand'),
              },
              duration: 6000,
            });
          } else {
            toast.error(t('auth.noFanAccount'));
          }
          setLoading(false);
          return;
        }

        // Fan role confirmed - check beta access and onboarding status
        const { data: fanAccess } = await supabase
          .from('fan_beta_access')
          .select('id')
          .eq('user_id', data.user.id)
          .maybeSingle();

        toast.success(t('auth.signInSuccess'));
        
        if (fanAccess) {
          // Has beta access - check onboarding status
          const { data: onboarding } = await supabase
            .from('fan_onboarding_progress')
            .select('onboarding_completed')
            .eq('user_id', data.user.id)
            .maybeSingle();
          
          if (onboarding?.onboarding_completed) {
            navigate('/fan/feed', { replace: true });
          } else {
            navigate('/fan/onboarding', { replace: true });
          }
        } else {
          // No beta access - go to gate/waitlist
          navigate('/fan', { replace: true });
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
    <div className="min-h-screen flex relative">
      {/* Mobile-first full-screen background */}
      <div className="absolute inset-0 lg:relative lg:w-1/2 lg:order-2">
        <img
          src={fanHero}
          alt="Concert crowd"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Dark overlay for mobile, gradient for desktop */}
        <div className="absolute inset-0 bg-black/60 lg:bg-gradient-to-r lg:from-background lg:via-background/50 lg:to-transparent" />
      </div>

      {/* Minimal header - logo + trust badge + language toggle */}
      <div className="absolute top-6 left-6 right-6 z-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Link to="/">
            <FlyMusicLogo size="sm" />
          </Link>
          <TrustBadge />
        </div>
        <LanguageToggle />
      </div>

      {/* Form container */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-8 pt-20 lg:order-1">
        <div className="w-full max-w-md space-y-8">

          <Card className="border-accent/20 animate-fade-in">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
                <Heart className="h-8 w-8 text-accent" />
              </div>
              <CardTitle className="text-2xl">{t('auth.signInFanTitle')}</CardTitle>
              <CardDescription>{t('auth.signInFanSubtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.fanEmailLabel')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="fan@example.com"
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
                <div className="flex justify-end">
                  <Link 
                    to="/forgot-password" 
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {t('auth.forgotPassword')}
                  </Link>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('auth.signingIn')}
                    </>
                  ) : (
                    t('auth.signInAsFan')
                  )}
                </Button>
              </form>

              {/* Create Account Section */}
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-foreground font-medium mb-2">{t('auth.newToFlyMusic')}</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    {t('auth.gotBetaCodeFan')}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/fan/invite')}
                    className="w-full"
                  >
                    {t('auth.createAccountBeta')}
                  </Button>
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  {t('auth.noCodeYet')}{' '}
                  <button
                    type="button"
                    onClick={() => setShowBetaDialog(true)}
                    className="text-primary hover:underline"
                  >
                    {t('auth.requestBetaAccess')}
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <RequestBetaDialog 
        open={showBetaDialog} 
        onOpenChange={setShowBetaDialog}
        fixedRole="fan"
      />
    </div>
  );
}
