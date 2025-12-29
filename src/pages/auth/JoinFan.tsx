import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FlyMusicLogo } from "@/components/FlyMusicLogo";
import TrustBadge from "@/components/trust/TrustBadge";
import { consumeInviteToken } from "@/hooks/useFanInviteAccess";
import fanHero from "@/assets/fan-hero-concert.png";
import { useUserAccessState } from "@/hooks/useUserAccessState";

const STORAGE_KEY = 'fan_invite_token';

export default function JoinFan() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { authenticated, hasFanAccess, fanOnboarded, loading: accessLoading } = useUserAccessState();
  
  // Auth guard: Redirect authenticated users away from join page
  useEffect(() => {
    if (accessLoading) return;
    
    if (authenticated) {
      if (hasFanAccess && fanOnboarded) {
        navigate('/fan/feed', { replace: true });
      } else if (hasFanAccess) {
        navigate('/fan/onboarding', { replace: true });
      } else {
        // User is logged in but no fan beta access - send to waitlist
        navigate('/fan', { replace: true });
      }
    }
  }, [authenticated, hasFanAccess, fanOnboarded, accessLoading, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            role: 'fan',
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error(t('auth.emailAlreadyExists'));
        } else {
          toast.error(error.message);
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        // Assign fan role
        await supabase.from('user_roles').insert({
          user_id: data.user.id,
          role: 'fan',
        });

        // Record permanent fan beta access in DB
        await supabase.from('fan_beta_access').insert({
          user_id: data.user.id,
          badge_name: 'Early Supporter',
        });

        // Consume invite token (mark as used)
        const inviteToken = localStorage.getItem(STORAGE_KEY);
        if (inviteToken) {
          await consumeInviteToken(inviteToken);
        }

        toast.success(t('auth.signUpSuccess'));
        navigate('/fan/onboarding');
      }
    } catch (err) {
      console.error('Sign up error:', err);
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

      {/* Minimal header - logo + trust badge */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Link to="/">
          <FlyMusicLogo size="sm" />
        </Link>
        <TrustBadge />
      </div>

      {/* Form container */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-8 pt-20 lg:order-1">
        <div className="w-full max-w-md space-y-8">

          <Card className="border-accent/20 animate-fade-in">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
                <Heart className="h-8 w-8 text-accent" />
              </div>
              <CardTitle className="text-2xl">{t('auth.joinFanTitle')}</CardTitle>
              <CardDescription>{t('auth.joinFanDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t('auth.fullName')}</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t('auth.fanNamePlaceholder')}
                    required
                  />
                </div>
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
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t('common.loading') : t('auth.createFanAccount')}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <p className="text-muted-foreground">
                  {t('auth.alreadyHaveAccount')}{' '}
                  <Link to="/signin/fan" className="text-primary hover:underline">
                    {t('auth.signInAsFan')}
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}
