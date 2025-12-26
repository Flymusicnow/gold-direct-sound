import { Link } from "react-router-dom";
import { ShieldX, Mic2, Heart, Briefcase, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { FlyMusicLogo } from "@/components/FlyMusicLogo";

interface WrongRoleMessageProps {
  requiredRole: 'artist' | 'fan' | 'brand' | 'admin';
}

export function WrongRoleMessage({ requiredRole }: WrongRoleMessageProps) {
  const { t } = useLanguage();
  const { hasRole } = useAuth();

  // Determine user's actual role
  const getUserRole = () => {
    if (hasRole('admin') || hasRole('super_admin')) return 'admin';
    if (hasRole('brand')) return 'brand';
    if (hasRole('artist')) return 'artist';
    if (hasRole('fan')) return 'fan';
    return null;
  };

  const userRole = getUserRole();

  // Get dashboard path for user's role
  const getDashboardPath = () => {
    switch (userRole) {
      case 'admin': return '/admin';
      case 'brand': return '/brand';
      case 'artist': return '/studio';
      case 'fan': return '/fan';
      default: return '/';
    }
  };

  // Get sign-in path for required role
  const getSignInPath = () => {
    switch (requiredRole) {
      case 'artist': return '/signin/artist';
      case 'fan': return '/signin/fan';
      case 'brand': return '/signin/brand';
      case 'admin': return '/'; // No public admin sign-in
      default: return '/';
    }
  };

  // Get role display name
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'artist': return t('auth.roleArtist');
      case 'fan': return t('auth.roleFan');
      case 'brand': return t('auth.roleBrand');
      case 'admin': return t('auth.roleAdmin');
      default: return role;
    }
  };

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'artist': return Mic2;
      case 'fan': return Heart;
      case 'brand': return Briefcase;
      default: return ShieldX;
    }
  };

  const RequiredIcon = getRoleIcon(requiredRole);

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <FlyMusicLogo size="md" />
        </div>

        <Card className="border-destructive/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <ShieldX className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">{t('auth.accessDenied')}</CardTitle>
            <CardDescription className="space-y-2">
              <p>
                {t('auth.areaFor').replace('{role}', getRoleDisplayName(requiredRole))}
              </p>
              {userRole && (
                <p className="text-muted-foreground">
                  {t('auth.yourAccountIs').replace('{role}', getRoleDisplayName(userRole))}
                </p>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Option 1: Sign in with correct role */}
            {requiredRole !== 'admin' && (
              <Button asChild className="w-full" variant="default">
                <Link to={getSignInPath()}>
                  <RequiredIcon className="mr-2 h-4 w-4" />
                  {t('auth.signInAs').replace('{role}', getRoleDisplayName(requiredRole))}
                </Link>
              </Button>
            )}

            {/* Option 2: Go to user's dashboard */}
            {userRole && (
              <Button asChild variant="outline" className="w-full">
                <Link to={getDashboardPath()}>
                  <Home className="mr-2 h-4 w-4" />
                  {t('auth.goToYourDashboard')}
                </Link>
              </Button>
            )}

            {/* Option 3: Go home if not logged in */}
            {!userRole && (
              <Button asChild variant="outline" className="w-full">
                <Link to="/">
                  <Home className="mr-2 h-4 w-4" />
                  {t('common.backToDashboard')}
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
