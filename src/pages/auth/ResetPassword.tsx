import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Music, CheckCircle, ArrowLeft } from "lucide-react";
import { FlyMusicLogo } from "@/components/FlyMusicLogo";
import TrustBadge from "@/components/trust/TrustBadge";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ResetPassword() {
  const { t } = useLanguage();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error(t('auth.resetPasswordPage.passwordsDoNotMatch'));
      return;
    }

    if (password.length < 6) {
      toast.error(t('auth.resetPasswordPage.passwordTooShort'));
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setSuccess(true);
      toast.success(t('auth.resetPasswordPage.updateSuccess'));
    } catch (error: any) {
      console.error("Password update error:", error);
      toast.error(t('auth.resetPasswordPage.updateError'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        {/* Minimal header */}
        <div className="absolute top-6 left-6 z-20 flex items-center gap-4">
          <Link to="/">
            <FlyMusicLogo size="sm" />
          </Link>
          <TrustBadge />
        </div>

        <div className="w-full max-w-md text-center animate-fade-in">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Music className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold bg-gradient-gold bg-clip-text text-transparent">
              FlyMusic
            </h1>
          </div>
          
          <div className="mb-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">{t('auth.resetPasswordPage.successTitle')}</h2>
            <p className="text-muted-foreground">
              {t('auth.resetPasswordPage.successMessage')}
            </p>
          </div>

          <Button 
            onClick={() => navigate('/auth')} 
            className="w-full bg-gradient-gold"
          >
            {t('auth.resetPasswordPage.goToSignIn')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      {/* Minimal header */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-4">
        <button onClick={() => navigate('/auth')} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Link to="/">
          <FlyMusicLogo size="sm" />
        </Link>
        <TrustBadge />
      </div>

      <div className="w-full max-w-md animate-fade-in">

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Music className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold bg-gradient-gold bg-clip-text text-transparent">
              {t('auth.resetPasswordPage.title')}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {t('auth.resetPasswordPage.subtitle')}
          </p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <Label htmlFor="password">{t('auth.resetPasswordPage.newPassword')}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder={t('auth.resetPasswordPage.passwordPlaceholder')}
              minLength={6}
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">{t('auth.resetPasswordPage.confirmPassword')}</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder={t('auth.resetPasswordPage.confirmPlaceholder')}
              minLength={6}
            />
          </div>

          <Button type="submit" className="w-full bg-gradient-gold" disabled={loading}>
            {loading ? t('auth.resetPasswordPage.saving') : t('auth.resetPasswordPage.saveButton')}
          </Button>
        </form>
      </div>
    </div>
  );
}
