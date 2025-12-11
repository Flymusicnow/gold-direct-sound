import { Link, useNavigate } from "react-router-dom";
import { Music, User, LogOut, Menu, Mic2, Heart, Search, Settings, CreditCard, Briefcase } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect } from "react";
import { FlyMusicLogo } from "@/components/FlyMusicLogo";
import TrustBadge from "@/components/trust/TrustBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Navigation = () => {
  const { user, profile, signOut, refreshProfile, hasRole } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🔍 Navigation Debug - User ID:', user?.id);
    console.log('🔍 Navigation Debug - Profile:', profile);
    console.log('🔍 Navigation Debug - Profile Role:', profile?.role);
    
    if (user && !profile) {
      console.log('⚠️ User exists but no profile loaded, refreshing...');
      refreshProfile();
    }
  }, [user, profile, refreshProfile]);

  // Role-aware logo routing
  const getLogoRoute = () => {
    if (!user) return "/";
    if (hasRole('fan')) return "/fan/feed";
    if (hasRole('artist')) return "/studio";
    if (hasRole('admin')) return "/admin";
    return "/";
  };

  // Get role-specific pricing link
  const getPricingRoute = () => {
    if (!user) return "/pricing";
    // Pricing page shows role-filtered content, same route works
    return "/pricing";
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={getLogoRoute()} className="flex items-center">
            <FlyMusicLogo size="md" />
          </Link>
          <TrustBadge />
        </div>

        <div className="hidden md:flex items-center gap-6">
          <Link to="/explore" className="text-foreground/80 hover:text-primary transition-colors">
            {t('nav.explore')}
          </Link>
          <Link to="/search" className="text-foreground/80 hover:text-primary transition-colors flex items-center gap-1">
            <Search className="h-4 w-4" />
            {t('nav.search')}
          </Link>
          
          {/* Role-based navigation items */}
          {user ? (
            <>
              {/* Artist sees Brand Opportunities */}
              {hasRole('artist') && (
                <>
                  <Link to="/studio/opportunities" className="text-foreground/80 hover:text-primary transition-colors flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    Brand Opportunities
                  </Link>
                  <Link to="/studio" className="text-foreground/80 hover:text-primary transition-colors">
                    {t('nav.myStudio')}
                  </Link>
                </>
              )}
              
              {/* Fan sees Fan Portal and Feed */}
              {hasRole('fan') && !hasRole('artist') && !hasRole('brand') && (
                <>
                  <Link to="/fan" className="text-foreground/80 hover:text-primary transition-colors">
                    {t('nav.fanPortal')}
                  </Link>
                  <Link to="/fan/feed" className="text-foreground/80 hover:text-primary transition-colors">
                    {t('nav.feed')}
                  </Link>
                </>
              )}
              
              {/* Brand sees Brand Dashboard */}
              {hasRole('brand') && (
                <Link to="/brand" className="text-foreground/80 hover:text-primary transition-colors">
                  Brand Dashboard
                </Link>
              )}
              
              {hasRole('admin') && (
                <Link to="/admin" className="text-foreground/80 hover:text-primary transition-colors">
                  {t('nav.admin')}
                </Link>
              )}
              
              <NotificationBell />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {/* Show only one Settings option - prefer artist settings if has both roles */}
                  {hasRole('artist') ? (
                    <DropdownMenuItem onClick={() => navigate('/studio/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                  ) : hasRole('fan') ? (
                    <DropdownMenuItem onClick={() => navigate('/fan/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                  ) : hasRole('brand') ? (
                    <DropdownMenuItem onClick={() => navigate('/brand/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('nav.signOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              {/* Unauthenticated users see Brands link and Pricing */}
              <Link to="/brands" className="text-foreground/80 hover:text-primary transition-colors">
                For Brands
              </Link>
              <Link to="/pricing" className="text-foreground/80 hover:text-primary transition-colors flex items-center gap-1">
                <CreditCard className="h-4 w-4" />
                Pricing
              </Link>
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={() => navigate('/auth')}>
                  {t('nav.signIn')}
                </Button>
                <Button 
                  variant="ghost" 
                  className="text-foreground/80"
                  onClick={() => navigate('/auth?mode=fan')}
                >
                  <Heart className="h-4 w-4 mr-1" />
                  {t('nav.joinFan')}
                </Button>
                <Button 
                  className="bg-gradient-gold" 
                  onClick={() => navigate('/auth?mode=artist')}
                >
                  <Mic2 className="h-4 w-4 mr-1" />
                  {t('nav.joinArtist')}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[hsl(0,0%,6%)] border-border">
              <DropdownMenuItem onClick={() => navigate('/explore')}>
                Explore Artists
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/search')}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </DropdownMenuItem>
              
              {user ? (
                <>
                  {/* Artist menu items */}
                  {hasRole('artist') && (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/studio/opportunities')}>
                        <Briefcase className="h-4 w-4 mr-2" />
                        Brand Opportunities
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/studio')}>
                        My Studio
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  {/* Fan menu items (only if not artist or brand) */}
                  {hasRole('fan') && !hasRole('artist') && !hasRole('brand') && (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/fan')}>
                        Fan Portal
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/fan/feed')}>
                        Feed
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  {/* Brand menu items */}
                  {hasRole('brand') && (
                    <DropdownMenuItem onClick={() => navigate('/brand')}>
                      Brand Dashboard
                    </DropdownMenuItem>
                  )}
                  
                  {hasRole('admin') && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      Admin
                    </DropdownMenuItem>
                  )}
                  
                  {/* Settings based on role */}
                  {hasRole('artist') ? (
                    <DropdownMenuItem onClick={() => navigate('/studio/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                  ) : hasRole('fan') ? (
                    <DropdownMenuItem onClick={() => navigate('/fan/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                  ) : hasRole('brand') ? (
                    <DropdownMenuItem onClick={() => navigate('/brand/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                  ) : null}
                  
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => navigate('/brands')}>
                    For Brands
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/pricing')}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pricing
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/auth')}>
                    Sign In
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/auth?mode=fan')}>
                    <Heart className="mr-2 h-4 w-4" />
                    Join as Fan
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/auth?mode=artist')}>
                    <Mic2 className="mr-2 h-4 w-4 text-primary" />
                    Join as Artist
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};