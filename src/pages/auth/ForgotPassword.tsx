import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Loader2, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FlyMusicLogo } from "@/components/FlyMusicLogo";
import TrustBadge from "@/components/trust/TrustBadge";

const RATE_LIMIT_KEY = 'forgot_password_attempts';
const MAX_ATTEMPTS = 3;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const emailSchema = z.string().email();

interface RateLimitData {
  attempts: number;
  windowStart: number;
}

export default function ForgotPassword() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [remainingMinutes, setRemainingMinutes] = useState(0);
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    checkRateLimit();
    const interval = setInterval(checkRateLimit, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const checkRateLimit = () => {
    const storedData = localStorage.getItem(RATE_LIMIT_KEY);
    if (!storedData) {
      setRateLimited(false);
      return;
    }

    try {
      const data: RateLimitData = JSON.parse(storedData);
      const now = Date.now();
      const windowEnd = data.windowStart + WINDOW_MS;

      if (now > windowEnd) {
        // Window expired, reset
        localStorage.removeItem(RATE_LIMIT_KEY);
        setRateLimited(false);
      } else if (data.attempts >= MAX_ATTEMPTS) {
        setRateLimited(true);
        setRemainingMinutes(Math.ceil((windowEnd - now) / 60000));
      } else {
        setRateLimited(false);
      }
    } catch {
      localStorage.removeItem(RATE_LIMIT_KEY);
      setRateLimited(false);
    }
  };

  const recordAttempt = () => {
    const storedData = localStorage.getItem(RATE_LIMIT_KEY);
    const now = Date.now();

    let data: RateLimitData;
    if (storedData) {
      data = JSON.parse(storedData);
      if (now > data.windowStart + WINDOW_MS) {
        // Window expired, start fresh
        data = { attempts: 1, windowStart: now };
      } else {
        data.attempts += 1;
      }
    } else {
      data = { attempts: 1, windowStart: now };
    }

    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
    checkRateLimit();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");

    // Validate email
    const result = emailSchema.safeParse(email.trim());
    if (!result.success) {
      setEmailError(t('auth.invalidEmail'));
      return;
    }

    if (rateLimited) {
      return;
    }

    setLoading(true);
    recordAttempt();

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/recovery`,
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error('Reset password error:', err);
      toast.error(t('errors.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="absolute top-6 left-6 right-6 z-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')} 
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Link to="/">
            <FlyMusicLogo size="sm" />
          </Link>
          <TrustBadge />
        </div>
        <LanguageToggle />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-8 pt-20">
        <div className="w-full max-w-md">
          <Card className="border-primary/20 animate-fade-in">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                {success ? (
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                ) : (
                  <Mail className="h-8 w-8 text-primary" />
                )}
              </div>
              <CardTitle className="text-2xl">
                {success ? t('auth.forgotPasswordPage.successTitle') : t('auth.forgotPasswordPage.title')}
              </CardTitle>
              <CardDescription>
                {success 
                  ? t('auth.forgotPasswordPage.successMessage')
                  : t('auth.forgotPasswordPage.subtitle')
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {success ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center">
                    {t('auth.forgotPasswordPage.checkSpam')}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate('/signin/artist')}
                  >
                    {t('auth.forgotPasswordPage.backToSignIn')}
                  </Button>
                </div>
              ) : rateLimited ? (
                <div className="space-y-4">
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-center">
                    <p className="text-destructive font-medium">
                      {t('auth.forgotPasswordPage.rateLimited')}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('auth.forgotPasswordPage.rateLimitedDescription').replace('{minutes}', String(remainingMinutes))}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(-1)}
                  >
                    {t('auth.forgotPasswordPage.backToSignIn')}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('auth.forgotPasswordPage.emailLabel')}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailError("");
                      }}
                      placeholder={t('auth.forgotPasswordPage.emailPlaceholder')}
                      required
                      className={emailError ? "border-destructive" : ""}
                    />
                    {emailError && (
                      <p className="text-sm text-destructive">{emailError}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('auth.forgotPasswordPage.sending')}
                      </>
                    ) : (
                      t('auth.forgotPasswordPage.sendButton')
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => navigate(-1)}
                  >
                    {t('auth.forgotPasswordPage.backToSignIn')}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
