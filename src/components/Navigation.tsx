import { Link, useNavigate, useLocation } from "react-router-dom";
import { Music, User, LogOut, Menu, Mic2, Heart, Search, Settings, CreditCard, Briefcase, Bug } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState, useCallback } from "react";
import { FlyMusicLogo } from "@/components/FlyMusicLogo";
import TrustBadge from "@/components/trust/TrustBadge";
import { useBetaAccess } from "@/hooks/useBetaAccess";
import { ReportIssueDialog } from "@/components/ReportIssueDialog";
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
  const location = useLocation();
  const { hasBetaAccess } = useBetaAccess();
  
  // Hide hamburger menu on landing page
  const isLandingPage = location.pathname === '/';
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Show report button to admins or beta users
  const canReportIssues = user && (hasRole('admin') || hasBetaAccess);

  // Golden Journey - Scroll listener for navigation anchoring effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Global keyboard shortcut: Cmd/Ctrl + Shift + B to open report dialog
  const handleGlobalKeydown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'b') {
      if (canReportIssues) {
        e.preventDefault();
        setReportDialogOpen(true);
      }
    }
  }, [canReportIssues]);

  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKeydown);
    return () => document.removeEventListener('keydown', handleGlobalKeydown);
  }, [handleGlobalKeydown]);

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
    if (hasRole('brand')) return "/brand";
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
    <nav className={`fixed top-0 left-0 right-0 z-50 nav-premium border-b border-border ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={getLogoRoute()} className="flex items-center">
            <FlyMusicLogo size="md" />
          </Link>
          <TrustBadge />
        </div>

        {/* Desktop Navigation - Hidden on landing page for clean beta look */}
        {!isLandingPage && (
          <div className="hidden md:flex items-center gap-6">
            <Link to="/explore" className="nav-link-gold">
              {t('nav.explore')}
            </Link>
            <Link to="/search" className="nav-link-gold flex items-center gap-1">
              <Search className="h-4 w-4" />
              {t('nav.search')}
            </Link>
            
            {/* Role-based navigation items */}
            {user ? (
              <>
                {/* Artist sees Brand Opportunities */}
                {hasRole('artist') && (
                  <>
                    <Link to="/studio/opportunities" className="nav-link-gold flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {t('nav.brandOpportunities')}
                    </Link>
                    <Link to={`/artist/${user?.id}`} className="nav-link-gold">
                      {t('nav.myArtistPage')}
                    </Link>
                    <Link to="/studio" className="nav-link-gold">
                      {t('nav.myStudio')}
                    </Link>
                  </>
                )}
                
                {/* Fan sees Fan Portal and Feed */}
                {hasRole('fan') && !hasRole('artist') && !hasRole('brand') && (
                  <>
                    <Link to="/fan" className="nav-link-gold">
                      {t('nav.fanPortal')}
                    </Link>
                    <Link to="/fan/feed" className="nav-link-gold">
                      {t('nav.feed')}
                    </Link>
                  </>
                )}
                
                {/* Brand sees Brand Dashboard */}
                {hasRole('brand') && (
                  <Link to="/brand" className="nav-link-gold">
                    {t('nav.brandDashboard')}
                  </Link>
                )}
                
                {hasRole('admin') && (
                  <Link to="/admin" className="nav-link-gold">
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
                        {t('nav.settings')}
                      </DropdownMenuItem>
                    ) : hasRole('fan') ? (
                      <DropdownMenuItem onClick={() => navigate('/fan/settings')}>
                        <Settings className="mr-2 h-4 w-4" />
                        {t('nav.settings')}
                      </DropdownMenuItem>
                    ) : hasRole('brand') ? (
                      <DropdownMenuItem onClick={() => navigate('/brand/settings')}>
                        <Settings className="mr-2 h-4 w-4" />
                        {t('nav.settings')}
                      </DropdownMenuItem>
                    ) : null}
                    
                    {/* Report issue - visible to beta users and admins */}
                    {canReportIssues && (
                      <DropdownMenuItem onClick={() => setReportDialogOpen(true)}>
                        <Bug className="mr-2 h-4 w-4" />
                        {t('nav.reportIssue')}
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuItem onClick={() => signOut()}>
                      <LogOut className="mr-2 h-4 w-4" />
                      {t('nav.signOut')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                {/* Unauthenticated users see expanded navigation */}
                <Link to="/how-it-works" className="nav-link-gold">
                  {t('nav.howItWorks')}
                </Link>
                <Link to="/top-artists" className="nav-link-gold">
                  {t('nav.topArtists')}
                </Link>
                <Link to="/trust" className="nav-link-gold">
                  {t('nav.trust')}
                </Link>
                <Link to="/brands" className="nav-link-gold">
                  {t('nav.forBrands')}
                </Link>
                <Link to="/pricing" className="nav-link-gold flex items-center gap-1">
                  <CreditCard className="h-4 w-4" />
                  {t('nav.pricing')}
                </Link>
                <div className="flex items-center gap-3">
                  <Button variant="ghost" onClick={() => navigate('/signin/artist')}>
                    {t('nav.signIn')}
                  </Button>
                  <Button
                    variant="ghost" 
                    className="text-foreground/80"
                    onClick={() => navigate('/join/fan')}
                  >
                    <Heart className="h-4 w-4 mr-1" />
                    {t('nav.joinFan')}
                  </Button>
                  <Button 
                    className="bg-gradient-gold" 
                    onClick={() => navigate('/join/artist')}
                  >
                    <Mic2 className="h-4 w-4 mr-1" />
                    {t('nav.joinArtist')}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Mobile Inline Nav - Logged-in users (prioritized scroll) */}
        {user && !isLandingPage && (
          <div className="flex md:hidden items-center gap-2 flex-1 min-w-0 ml-2">
            {/* Scrollable nav container with fade hint */}
            <div className="relative flex-1 min-w-0">
              {/* Right fade gradient - hints more content */}
              <div className="nav-fade-right" />
              
              <div className="overflow-x-auto scrollbar-hide flex items-center gap-3 px-1 pr-6">
                {/* Priority 1: My Studio (artists only) */}
                {hasRole('artist') && (
                  <Link 
                    to="/studio" 
                    className={cn("nav-link-mobile whitespace-nowrap", location.pathname.startsWith('/studio') && 'active')}
                  >
                    {t('nav.myStudio')}
                  </Link>
                )}
                
                {/* Priority 2: My Artist Page (artists only) */}
                {hasRole('artist') && (
                  <Link 
                    to={`/artist/${user?.id}`} 
                    className={cn("nav-link-mobile whitespace-nowrap", location.pathname === `/artist/${user?.id}` && 'active')}
                  >
                    {t('nav.myArtistPage')}
                  </Link>
                )}
                
                {/* Fan priority: Dashboard, Feed */}
                {hasRole('fan') && !hasRole('artist') && !hasRole('brand') && (
                  <>
                    <Link 
                      to="/fan/dashboard" 
                      className={cn("nav-link-mobile whitespace-nowrap", location.pathname === '/fan/dashboard' && 'active')}
                    >
                      {t('nav.dashboard')}
                    </Link>
                    <Link 
                      to="/fan/feed" 
                      className={cn("nav-link-mobile whitespace-nowrap", location.pathname === '/fan/feed' && 'active')}
                    >
                      {t('nav.feed')}
                    </Link>
                  </>
                )}
                
                {/* Brand priority: Dashboard */}
                {hasRole('brand') && (
                  <Link 
                    to="/brand" 
                    className={cn("nav-link-mobile whitespace-nowrap", location.pathname.startsWith('/brand') && 'active')}
                  >
                    {t('nav.brandDashboard')}
                  </Link>
                )}
                
                {/* Priority 3: Explore Artists */}
                <Link 
                  to="/explore" 
                  className={cn("nav-link-mobile whitespace-nowrap", location.pathname === '/explore' && 'active')}
                >
                  {t('nav.explore')}
                </Link>
                
                {/* Priority 4: Search */}
                <Link 
                  to="/search" 
                  className={cn("nav-link-mobile whitespace-nowrap flex items-center gap-1", location.pathname === '/search' && 'active')}
                >
                  <Search className="h-3.5 w-3.5" />
                  {t('nav.search')}
                </Link>
                
                {/* Priority 5: Brand Opportunities (artists only - lowest priority) */}
                {hasRole('artist') && (
                  <Link 
                    to="/studio/opportunities" 
                    className={cn("nav-link-mobile whitespace-nowrap flex items-center gap-1", location.pathname === '/studio/opportunities' && 'active')}
                  >
                    <Briefcase className="h-3.5 w-3.5" />
                    {t('nav.opportunities')}
                  </Link>
                )}
                
                {/* Admin link */}
                {hasRole('admin') && (
                  <Link 
                    to="/admin" 
                    className={cn("nav-link-mobile whitespace-nowrap", location.pathname.startsWith('/admin') && 'active')}
                  >
                    {t('nav.admin')}
                  </Link>
                )}
              </div>
            </div>
            
            {/* Fixed right icons - never scroll */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-[hsl(0,0%,6%)] border-border">
                  {hasRole('artist') ? (
                    <DropdownMenuItem onClick={() => navigate('/studio/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      {t('nav.settings')}
                    </DropdownMenuItem>
                  ) : hasRole('fan') ? (
                    <DropdownMenuItem onClick={() => navigate('/fan/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      {t('nav.settings')}
                    </DropdownMenuItem>
                  ) : hasRole('brand') ? (
                    <DropdownMenuItem onClick={() => navigate('/brand/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      {t('nav.settings')}
                    </DropdownMenuItem>
                  ) : null}
                  
                  {canReportIssues && (
                    <DropdownMenuItem onClick={() => setReportDialogOpen(true)}>
                      <Bug className="mr-2 h-4 w-4" />
                      {t('nav.reportIssue')}
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('nav.signOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}

        {/* Mobile Hamburger - Unauthenticated users only */}
        {!user && !isLandingPage && (
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[hsl(0,0%,6%)] border-border">
                <DropdownMenuItem onClick={() => navigate('/explore')}>
                  {t('nav.explore')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/search')}>
                  <Search className="h-4 w-4 mr-2" />
                  {t('nav.search')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/how-it-works')}>
                  {t('nav.howItWorks')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/top-artists')}>
                  {t('nav.topArtists')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/trust')}>
                  {t('nav.trust')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/brands')}>
                  {t('nav.forBrands')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/pricing')}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  {t('nav.pricing')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/signin/artist')}>
                  {t('nav.signIn')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/join/fan')}>
                  <Heart className="mr-2 h-4 w-4" />
                  {t('nav.joinFan')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/join/artist')}>
                  <Mic2 className="mr-2 h-4 w-4 text-primary" />
                  {t('nav.joinArtist')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      
      {/* Report Issue Dialog */}
      <ReportIssueDialog open={reportDialogOpen} onOpenChange={setReportDialogOpen} />
    </nav>
  );
};
