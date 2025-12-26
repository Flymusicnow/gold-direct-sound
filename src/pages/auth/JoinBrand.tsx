import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Briefcase, ArrowLeft } from "lucide-react";
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

export default function JoinBrand() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  // Check if this email has an approved brand application using RPC (bypasses RLS)
  const checkBrandApproval = async (email: string): Promise<'approved' | 'pending' | 'rejected' | null> => {
    const { data, error } = await supabase
      .rpc('check_brand_application_status', { _email: email });
    
    if (error || !data) return null;
    return data as 'approved' | 'pending' | 'rejected';
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check brand application status first
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

      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            role: 'brand',
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
        // Assign brand role
        await supabase.from('user_roles').insert({
          user_id: data.user.id,
          role: 'brand',
        });

        toast.success(t('auth.signUpSuccess'));
        navigate('/brand/onboarding');
      }
    } catch (err) {
      console.error('Sign up error:', err);
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

          <Card className="border-secondary/20 animate-fade-in">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-secondary/10 flex items-center justify-center">
                <Briefcase className="h-8 w-8 text-secondary-foreground" />
              </div>
              <CardTitle className="text-2xl">{t('auth.joinBrandTitle')}</CardTitle>
              <CardDescription>{t('auth.joinBrandDescription')}</CardDescription>
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
                    placeholder={t('auth.brandNamePlaceholder')}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.brandEmailLabel')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="brand@company.com"
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
                  {loading ? t('common.loading') : t('auth.createBrandAccount')}
                </Button>
              </form>

              <div className="mt-6 space-y-4 text-center text-sm">
                <p className="text-muted-foreground">
                  {t('auth.alreadyHaveAccount')}{' '}
                  <Link to="/signin/brand" className="text-primary hover:underline">
                    {t('auth.signInAsBrand')}
                  </Link>
                </p>
                <p className="text-muted-foreground">
                  {t('auth.needToApply')}{' '}
                  <Link to="/brands/apply" className="text-primary hover:underline">
                    {t('auth.applyForBrandAccess')}
                  </Link>
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
          alt="Brand collaboration"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
      </div>
    </div>
  );
}
