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
import authHero from "@/assets/auth-hero-concert.png";

export default function SignInBrand() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Check if user has brand role
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id);
        
        const hasBrand = roles?.some(r => r.role === 'brand');
        
        if (!hasBrand) {
          // User doesn't have brand role - show error with correct sign-in link
          const hasArtist = roles?.some(r => r.role === 'artist');
          const hasFan = roles?.some(r => r.role === 'fan');
          
          await supabase.auth.signOut();
          
          if (hasArtist) {
            toast.error(t('auth.wrongRoleArtist'), {
              action: {
                label: t('auth.signInAsArtist'),
                onClick: () => navigate('/signin/artist'),
              },
            });
          } else if (hasFan) {
            toast.error(t('auth.wrongRoleFan'), {
              action: {
                label: t('auth.signInAsFan'),
                onClick: () => navigate('/signin/fan'),
              },
            });
          } else {
            toast.error(t('auth.noBrandAccount'));
          }
          setLoading(false);
          return;
        }

        toast.success(t('auth.signInSuccess'));
        navigate('/brand');
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
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <FlyMusicLogo size="md" />
          </div>

          <Card className="border-secondary/20">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-secondary/10 flex items-center justify-center">
                <Briefcase className="h-8 w-8 text-secondary-foreground" />
              </div>
              <CardTitle className="text-2xl">{t('auth.signInBrandTitle')}</CardTitle>
              <CardDescription>{t('auth.signInBrandDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignIn} className="space-y-4">
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
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t('common.loading') : t('auth.signInAsBrand')}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <p className="text-muted-foreground">
                  {t('auth.dontHaveAccount')}{' '}
                  <Link to="/join/brand" className="text-primary hover:underline">
                    {t('auth.createBrandAccount')}
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
