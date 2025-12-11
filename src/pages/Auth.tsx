import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
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
      toast.success("If an account exists with this email, we've sent a password reset link.");
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

        toast.success("Welcome back!");

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
          const hasArtist = roles.some(r => r.role === 'artist');
          const hasFan = roles.some(r => r.role === 'fan');
          
          if (hasArtist && !hasFan) {
            navigate('/studio');
          } else {
            navigate('/fan');
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

        toast.success(isArtistSignup ? "Artist account created! Complete your profile to get started." : "Account created!");
        
        if (isArtistSignup) {
          navigate('/studio');
        } else {
          navigate('/fan');
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
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
            Back to Sign In
          </button>

          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Music className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold bg-gradient-gold bg-clip-text text-transparent">
                Reset Password
              </h1>
            </div>
            <p className="text-muted-foreground">
              Enter your email and we'll send a reset link if an account exists.
            </p>
          </div>

          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>

            <Button type="submit" className="w-full bg-gradient-gold" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
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
              FlyMusic Gold
            </h1>
          </div>
          <p className="text-muted-foreground">
            {isLogin 
              ? "Welcome back" 
              : isArtistSignup 
                ? (
                  <span className="flex items-center justify-center gap-2">
                    <Mic2 className="h-4 w-4 text-primary" />
                    Join as an Artist — Upload & share your music
                  </span>
                )
                : (
                  <span className="flex items-center justify-center gap-2">
                    <Heart className="h-4 w-4" />
                    Join as a Fan — Discover & support artists
                  </span>
                )
            }
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Enter your full name"
              />
            </div>
          )}

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              minLength={6}
            />
          </div>

          <Button type="submit" className="w-full bg-gradient-gold" disabled={loading}>
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
          </Button>

          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
            >
              {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </button>
            
            {isLogin && (
              <div>
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Forgot your password?
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
                  {isArtistSignup ? "Sign up as a fan instead" : "Are you an artist? Sign up here"}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
