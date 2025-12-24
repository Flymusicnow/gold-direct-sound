import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePromoFunnel } from "@/hooks/usePromoFunnel";
import { Music, Mic2, Heart, ArrowLeft } from "lucide-react";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode');
  const [isLogin, setIsLogin] = useState(initialMode !== 'artist');
  const [isArtistSignup, setIsArtistSignup] = useState(initialMode === 'artist');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  // Process promo funnel after authentication
  usePromoFunnel(user?.id);

  useEffect(() => {
    // Check if there's a promo context - if so, don't auto-redirect
    const promoContext = localStorage.getItem('flymusic_promo');
    if (user && !promoContext) {
      navigate('/');
    }
    setAuthChecked(true);
  }, [user, navigate]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      // Always show success message for security (don't reveal if email exists)
      toast.success(t('auth.resetLinkSent'));
      setIsForgotPassword(false);
      
      if (error) {
        console.error("Password reset error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        const mode = searchParams.get('mode');
        
        // Check user roles and redirect accordingly
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id);

        toast.success(t('auth.welcomeBack'));

        if (!roles || roles.length === 0) {
          // If user has no roles BUT came with a mode parameter,
          // automatically set their role instead of redirecting to role-selection
          if (mode === 'fan' || mode === 'artist') {
            await supabase.from('user_roles').upsert({
              user_id: data.user.id,
              role: mode,
            }, { onConflict: 'user_id,role', ignoreDuplicates: true });
            
            navigate(mode === 'fan' ? '/fan' : '/studio');
          } else {
            // No mode specified - let them choose
            navigate('/role-selection');
          }
        } else {
          // User already has roles - redirect based on existing roles
          // Priority: admin/super_admin > brand > artist > fan
          const hasAdmin = roles.some(r => r.role === 'admin' || r.role === 'super_admin');
          const hasBrand = roles.some(r => r.role === 'brand');
          const hasArtist = roles.some(r => r.role === 'artist');
          const hasFan = roles.some(r => r.role === 'fan');
          
          if (hasAdmin) {
            navigate('/admin');
          } else if (hasBrand) {
            navigate('/brand');
          } else if (hasArtist) {
            navigate('/studio');
          } else if (hasFan) {
            navigate('/fan');
          } else {
            navigate('/');
          }
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: fullName,
              role: isArtistSignup ? 'artist' : 'fan',
            },
          },
        });

        if (error) throw error;

        // Insert role into user_roles table (use upsert to prevent duplicates)
        if (data.user) {
          const mode = searchParams.get('mode');
          const roleToSet = mode === 'fan' ? 'fan' : isArtistSignup ? 'artist' : 'fan';
          
          await supabase.from('user_roles').upsert({
            user_id: data.user.id,
            role: roleToSet,
          }, { onConflict: 'user_id,role', ignoreDuplicates: true });
        }

        toast.success(isArtistSignup ? t('auth.artistAccountCreated') : t('auth.accountCreated'));
        
        if (isArtistSignup) {
          navigate('/studio');
        } else {
          navigate('/fan');
        }
      }
    } catch (error: any) {
      toast.error(error.message || t('auth.authenticationFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth to prevent flash
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <button
            type="button"
            onClick={() => setIsForgotPassword(false)}
            className="mb-6 gap-2 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('auth.backToSignIn')}
          </button>

          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Music className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold bg-gradient-gold bg-clip-text text-transparent">
                {t('auth.resetPassword')}
              </h1>
            </div>
            <p className="text-muted-foreground">
              {t('auth.resetPasswordDescription')}
            </p>
          </div>

          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={t('auth.enterEmail')}
              />
            </div>

            <Button type="submit" className="w-full bg-gradient-gold" disabled={loading}>
              {loading ? t('auth.sending') : t('auth.sendResetLink')}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Music className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold bg-gradient-gold bg-clip-text text-transparent">
              FlyMusic
            </h1>
          </div>
          <p className="text-muted-foreground">
            {isLogin 
              ? t('auth.welcomeBack')
              : isArtistSignup 
                ? (
                  <span className="flex items-center justify-center gap-2">
                    <Mic2 className="h-4 w-4 text-primary" />
                    {t('auth.joinAsArtist')}
                  </span>
                )
                : (
                  <span className="flex items-center justify-center gap-2">
                    <Heart className="h-4 w-4" />
                    {t('auth.joinAsFan')}
                  </span>
                )
            }
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div>
              <Label htmlFor="fullName">{t('auth.fullName')}</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder={t('auth.enterFullName')}
              />
            </div>
          )}

          <div>
            <Label htmlFor="email">{t('auth.email')}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={t('auth.enterEmail')}
            />
          </div>

          <div>
            <Label htmlFor="password">{t('auth.password')}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder={t('auth.enterPassword')}
              minLength={6}
            />
          </div>

          <Button type="submit" className="w-full bg-gradient-gold" disabled={loading}>
            {loading ? t('auth.pleaseWait') : isLogin ? t('auth.signIn') : t('auth.createAccount')}
          </Button>

          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
            >
              {isLogin ? t('auth.needAccount') : t('auth.alreadyHaveAccount')}
            </button>
            
            {isLogin && (
              <div>
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  {t('auth.forgotPassword')}
                </button>
              </div>
            )}
            
            {!isLogin && (
              <div>
                <button
                  type="button"
                  onClick={() => setIsArtistSignup(!isArtistSignup)}
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  {isArtistSignup ? t('auth.signUpAsFan') : t('auth.signUpAsArtist')}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
