import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePromoFunnel } from "@/hooks/usePromoFunnel";
import { Music, Mic2, Heart, ArrowLeft, Building2 } from "lucide-react";
import authHeroImage from "@/assets/auth-hero-concert.png";
import { FlyMusicLogo } from "@/components/FlyMusicLogo";
import TrustBadge from "@/components/trust/TrustBadge";

// Role configuration for contextual auth
const roleConfig = {
  brand: {
    icon: Building2,
    titleKey: 'signInAsBrand',
    subtitleKey: 'brandSubtitle',
    emailPlaceholderKey: 'brandEmailPlaceholder',
    color: 'text-primary',
  },
  artist: {
    icon: Mic2,
    titleKey: 'joinAsArtist',
    subtitleKey: 'artistSubtitle',
    emailPlaceholderKey: 'artistEmailPlaceholder',
    color: 'text-primary',
  },
  fan: {
    icon: Heart,
    titleKey: 'joinAsFan',
    subtitleKey: 'fanSubtitle',
    emailPlaceholderKey: 'fanEmailPlaceholder',
    color: 'text-pink-500',
  },
  default: {
    icon: Music,
    titleKey: 'welcomeBack',
    subtitleKey: 'signInToAccess',
    emailPlaceholderKey: 'enterEmail',
    color: 'text-primary',
  },
};

export default function Auth() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') as 'brand' | 'artist' | 'fan' | null;
  const initialMode = searchParams.get('mode');
  const [isLogin, setIsLogin] = useState(initialMode !== 'artist' && initialMode !== 'fan');
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

  // Get the current role context
  const currentRole = mode && roleConfig[mode] ? mode : 'default';
  const config = roleConfig[currentRole];
  const RoleIcon = config.icon;

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

  // Check if email has an approved brand application using RPC (bypasses RLS)
  const checkBrandApproval = async (userEmail: string): Promise<'approved' | 'pending' | 'rejected' | 'not_found'> => {
    const { data, error } = await supabase
      .rpc('check_brand_application_status', { _email: userEmail });
    
    if (error || !data) return 'not_found';
    return data as 'approved' | 'pending' | 'rejected';
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
          } else if (mode === 'brand') {
            // Check if user has an approved brand application
            const approvalStatus = await checkBrandApproval(email);
            
            if (approvalStatus === 'approved') {
              // Assign brand role and redirect to onboarding
              await supabase.from('user_roles').upsert({
                user_id: data.user.id,
                role: 'brand',
              }, { onConflict: 'user_id,role', ignoreDuplicates: true });
              
              navigate('/brand/onboarding');
            } else if (approvalStatus === 'pending') {
              toast.error(t('auth.brandApplicationPending'));
              await supabase.auth.signOut();
            } else if (approvalStatus === 'rejected') {
              toast.error(t('auth.brandApplicationRejected'));
              await supabase.auth.signOut();
            } else {
              toast.error(t('auth.noBrandApplication'));
              await supabase.auth.signOut();
            }
          } else {
            // No mode specified - let them choose
            navigate('/role-selection');
          }
        } else {
          // User already has roles
          const hasAdmin = roles.some(r => r.role === 'admin' || r.role === 'super_admin');
          const hasBrand = roles.some(r => r.role === 'brand');
          const hasArtist = roles.some(r => r.role === 'artist');
          const hasFan = roles.some(r => r.role === 'fan');
          
          // If mode=brand and user doesn't have brand role, check if they have approved application
          if (mode === 'brand' && !hasBrand) {
            const approvalStatus = await checkBrandApproval(email);
            
            if (approvalStatus === 'approved') {
              // Add brand role to existing user
              await supabase.from('user_roles').upsert({
                user_id: data.user.id,
                role: 'brand',
              }, { onConflict: 'user_id,role', ignoreDuplicates: true });
              
              navigate('/brand/onboarding');
              return;
            } else if (approvalStatus === 'pending') {
              toast.error(t('auth.brandApplicationPending'));
              await supabase.auth.signOut();
              return;
            } else if (approvalStatus === 'rejected') {
              toast.error(t('auth.brandApplicationRejected'));
              await supabase.auth.signOut();
              return;
            } else {
              toast.error(t('auth.noBrandApplication'));
              await supabase.auth.signOut();
              return;
            }
          }
          
          // If mode matches an existing role, go there
          if (mode === 'brand' && hasBrand) {
            navigate('/brand');
          } else if (mode === 'artist' && hasArtist) {
            navigate('/studio');
          } else if (mode === 'fan' && hasFan) {
            navigate('/fan');
          } else if (hasAdmin) {
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
        // Handle brand signup
        if (mode === 'brand') {
          // Check if email has approved brand application before signup
          const approvalStatus = await checkBrandApproval(email);
          
          if (approvalStatus !== 'approved') {
            if (approvalStatus === 'pending') {
              toast.error(t('auth.brandApplicationPending'));
            } else if (approvalStatus === 'rejected') {
              toast.error(t('auth.brandApplicationRejected'));
            } else {
              toast.error(t('auth.noBrandApplication'));
            }
            setLoading(false);
            return;
          }
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: fullName,
              role: mode === 'brand' ? 'brand' : isArtistSignup ? 'artist' : 'fan',
            },
          },
        });

        if (error) throw error;

        // Insert role into user_roles table (use upsert to prevent duplicates)
        if (data.user) {
          const roleToSet = mode === 'brand' ? 'brand' : mode === 'fan' ? 'fan' : isArtistSignup ? 'artist' : 'fan';
          
          await supabase.from('user_roles').upsert({
            user_id: data.user.id,
            role: roleToSet,
          }, { onConflict: 'user_id,role', ignoreDuplicates: true });
        }

        if (mode === 'brand') {
          toast.success(t('auth.brandAccountCreated'));
          navigate('/brand/onboarding');
        } else {
          toast.success(isArtistSignup ? t('auth.artistAccountCreated') : t('auth.accountCreated'));
          
          if (isArtistSignup) {
            navigate('/studio');
          } else {
            navigate('/fan');
          }
        }
      }
    } catch (error: any) {
      toast.error(error.message || t('auth.authenticationFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Get contextual email placeholder
  const getEmailPlaceholder = () => {
    if (mode === 'brand') return t('auth.brandEmailPlaceholder');
    if (mode === 'artist' || isArtistSignup) return t('auth.artistEmailPlaceholder');
    if (mode === 'fan' || !isLogin) return t('auth.fanEmailPlaceholder');
    return t('auth.enterEmail');
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
      <div className="min-h-screen flex items-center justify-center px-4 py-12 relative">
        {/* Minimal header - logo + trust badge */}
        <div className="absolute top-6 left-6 z-20 flex items-center gap-4">
          <button onClick={() => setIsForgotPassword(false)} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Link to="/">
            <FlyMusicLogo size="sm" />
          </Link>
          <TrustBadge />
        </div>

        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${authHeroImage})` }}
        >
          <div className="absolute inset-0 bg-black/60" />
        </div>
        <div className="w-full max-w-md relative z-10 animate-fade-in">
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

  // Determine which CTA is primary based on context
  const isArtistPrimary = mode === 'artist' || isArtistSignup;
  const isFanPrimary = mode === 'fan' || (!isLogin && !isArtistSignup);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative">
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

      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${authHeroImage})` }}
      >
        <div className="absolute inset-0 bg-black/60" />
      </div>
      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Role-aware header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <RoleIcon className={`h-8 w-8 ${config.color}`} />
            <h1 className="text-3xl font-bold bg-gradient-gold bg-clip-text text-transparent">
              {mode === 'brand' 
                ? t('auth.signInAsBrand')
                : isLogin 
                  ? 'FlyMusic'
                  : isArtistSignup 
                    ? t('auth.joinAsArtist')
                    : t('auth.joinAsFan')
              }
            </h1>
          </div>
          <p className="text-muted-foreground">
            {mode === 'brand'
              ? t('auth.brandSubtitle')
              : isLogin 
                ? t('auth.welcomeBack')
                : isArtistSignup 
                  ? t('auth.artistSubtitle')
                  : t('auth.fanSubtitle')
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
              placeholder={getEmailPlaceholder()}
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
            {/* Show signup toggle - brand mode shows special text */}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
            >
              {isLogin 
                ? (mode === 'brand' ? t('auth.needAccount') : t('auth.needAccount'))
                : t('auth.alreadyHaveAccount')
              }
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
            
            {/* Role toggle CTAs - only show one as primary based on context */}
            {!isLogin && mode !== 'brand' && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsArtistSignup(!isArtistSignup)}
                  className={`text-sm transition-colors ${
                    isArtistSignup 
                      ? 'text-muted-foreground hover:text-primary' 
                      : 'text-muted-foreground hover:text-primary'
                  }`}
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