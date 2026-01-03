import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, AlertCircle, CheckCircle, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { FlyMusicLogo } from "@/components/FlyMusicLogo";
import TrustBadge from "@/components/trust/TrustBadge";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";

type PageState = 'loading' | 'form' | 'success' | 'expired' | 'invalid';

export default function Recovery() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [pageState, setPageState] = useState<PageState>('loading');
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");

  useEffect(() => {
    validateRecoveryLink();
  }, []);

  const validateRecoveryLink = async () => {
    try {
      // Parse hash fragment first (most common format)
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      
      // Parse query params as fallback
      const searchParams = new URLSearchParams(window.location.search);
      
      // Extract tokens from hash or query
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type') || searchParams.get('type');
      const code = searchParams.get('code');
      
      // Validate intent - must be recovery type
      if (type !== 'recovery') {
        setPageState('invalid');
        cleanUrl();
        return;
      }
      
      // Try to establish session
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        
        if (error) {
          if (error.message.includes('expired') || error.message.includes('invalid')) {
            setPageState('expired');
          } else {
            setPageState('invalid');
          }
          cleanUrl();
          return;
        }
        
        setPageState('form');
        cleanUrl();
        return;
      }
      
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
          if (error.message.includes('expired') || error.message.includes('invalid')) {
            setPageState('expired');
          } else {
            setPageState('invalid');
          }
          cleanUrl();
          return;
        }
        
        setPageState('form');
        cleanUrl();
        return;
      }
      
      // No valid tokens found - check if we have an existing recovery session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setPageState('form');
        cleanUrl();
        return;
      }
      
      // No tokens and no session - invalid link
      setPageState('invalid');
      cleanUrl();
      
    } catch {
      setPageState('invalid');
      cleanUrl();
    }
  };

  const cleanUrl = () => {
    // Strip tokens from URL for security
    window.history.replaceState({}, document.title, '/auth/recovery');
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setConfirmError("");
    
    // Validate password length (min 8 per Super Card)
    if (password.length < 8) {
      setPasswordError(t('auth.recoveryPage.passwordMinLength'));
      return;
    }
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setConfirmError(t('auth.recoveryPage.passwordsDoNotMatch'));
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        // Handle same password error specifically
        if (error.message.includes('same_password') || 
            error.message.includes('different from the old password')) {
          setPasswordError(t('auth.recoveryPage.samePasswordError'));
          return;
        }
        if (error.message.includes('expired') || error.message.includes('session')) {
          setPageState('expired');
          return;
        }
        toast.error(t('auth.recoveryPage.couldNotUpdate'));
        return;
      }

      setPageState('success');
      toast.success(t('auth.recoveryPage.successTitle'));
      
      // Auto-redirect after 1.5s with role-based routing
      setTimeout(async () => {
        await redirectBasedOnRole();
      }, 1500);
      
    } catch {
      toast.error(t('auth.recoveryPage.couldNotUpdate'));
    } finally {
      setLoading(false);
    }
  };

  const redirectBasedOnRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth/login');
        return;
      }
      
      // Fetch roles - NEVER use .single()
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      if (error || !roles || roles.length === 0) {
        // Fail-closed but user-friendly - don't log out
        navigate('/signin/artist');
        return;
      }
      
      const hasArtist = roles.some(r => r.role === 'artist');
      
      if (hasArtist) {
        navigate('/studio');
      } else {
        navigate('/');
      }
    } catch {
      navigate('/signin/artist');
    }
  };

  // Loading state
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">{t('auth.recoveryPage.validatingLink')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Expired link state
  if (pageState === 'expired') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header showBack={false} />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md text-center animate-fade-in">
            <div className="mb-8">
              <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">{t('auth.recoveryPage.expiredTitle')}</h2>
              <p className="text-muted-foreground">
                {t('auth.recoveryPage.expiredMessage')}
              </p>
            </div>
            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/forgot-password')} 
                className="w-full"
              >
                {t('auth.recoveryPage.resendLink')}
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/signin/artist')} 
                className="w-full"
              >
                {t('auth.recoveryPage.backToSignIn')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Invalid link state
  if (pageState === 'invalid') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header showBack={false} />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md text-center animate-fade-in">
            <div className="mb-8">
              <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">{t('auth.recoveryPage.invalidTitle')}</h2>
              <p className="text-muted-foreground">
                {t('auth.recoveryPage.invalidMessage')}
              </p>
            </div>
            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/forgot-password')} 
                className="w-full"
              >
                {t('auth.recoveryPage.resendLink')}
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/signin/artist')} 
                className="w-full"
              >
                {t('auth.recoveryPage.backToSignIn')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (pageState === 'success') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header showBack={false} />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md text-center animate-fade-in">
            <div className="mb-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">{t('auth.recoveryPage.successTitle')}</h2>
              <p className="text-muted-foreground">
                {t('auth.recoveryPage.successRedirecting')}
              </p>
            </div>
            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  // Form state (happy path)
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">
              {t('auth.recoveryPage.title')}
            </h1>
            <p className="text-muted-foreground">
              {t('auth.recoveryPage.subtitle')}
            </p>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.recoveryPage.newPassword')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError("");
                  }}
                  required
                  placeholder={t('auth.recoveryPage.passwordPlaceholder')}
                  minLength={8}
                  className={passwordError ? "border-destructive pr-10" : "pr-10"}
                  aria-describedby={passwordError ? "password-error" : "password-hint"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordError ? (
                <p id="password-error" className="text-sm text-destructive" role="alert">
                  {passwordError}
                </p>
              ) : (
                <p id="password-hint" className="text-sm text-muted-foreground">
                  {t('auth.recoveryPage.passwordRulesHint')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('auth.recoveryPage.confirmPassword')}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setConfirmError("");
                  }}
                  required
                  placeholder={t('auth.recoveryPage.confirmPlaceholder')}
                  minLength={8}
                  className={confirmError ? "border-destructive pr-10" : "pr-10"}
                  aria-describedby={confirmError ? "confirm-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmError && (
                <p id="confirm-error" className="text-sm text-destructive" role="alert">
                  {confirmError}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('auth.recoveryPage.updating')}
                </>
              ) : (
                t('auth.recoveryPage.updatePassword')
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Header component for consistent layout
function Header({ showBack = true }: { showBack?: boolean }) {
  const navigate = useNavigate();
  
  return (
    <div className="absolute top-6 left-6 right-6 z-20 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {showBack && (
          <button 
            onClick={() => navigate('/signin/artist')} 
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <Link to="/">
          <FlyMusicLogo size="sm" />
        </Link>
        <TrustBadge />
      </div>
      <LanguageToggle />
    </div>
  );
}
