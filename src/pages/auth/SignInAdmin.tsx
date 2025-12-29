import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FlyMusicLogo } from "@/components/FlyMusicLogo";

export default function SignInAdmin() {
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
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Invalid credentials. Admin accounts are invite-only.");
        } else {
          toast.error(error.message);
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        // Check if user has admin role
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id);
        
        const hasAdmin = roles?.some(r => r.role === 'admin' || r.role === 'super_admin');
        
        if (!hasAdmin) {
          await supabase.auth.signOut();
          toast.error("Access denied. This login is for administrators only.");
          setLoading(false);
          return;
        }

        toast.success("Welcome back, Admin");
        navigate('/admin');
      }
    } catch (err) {
      console.error('Sign in error:', err);
      toast.error(t('errors.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative">
      {/* Subtle admin-themed background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/30" />
      
      {/* Minimal header */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-4">
        <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Link to="/">
          <FlyMusicLogo size="sm" />
        </Link>
      </div>

      {/* Form container */}
      <div className="relative z-10 w-full max-w-md p-8">
        <Card className="border-border/50 animate-fade-in">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <Shield className="h-8 w-8 text-foreground" />
            </div>
            <CardTitle className="text-2xl">Admin Sign In</CardTitle>
            <CardDescription>Restricted access for administrators</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Admin email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@flymusic.io"
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
                {loading ? t('common.loading') : "Sign In as Admin"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
