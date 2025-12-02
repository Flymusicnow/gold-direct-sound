import { Link, useNavigate } from "react-router-dom";
import { Music, User, LogOut, Menu, Mic2, Heart, Search } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { FlyMusicLogo } from "@/components/FlyMusicLogo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Navigation = () => {
  const { user, profile, signOut, refreshProfile, hasRole } = useAuth();
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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to={getLogoRoute()} className="flex items-center">
          <FlyMusicLogo size="md" />
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link to="/explore" className="text-foreground/80 hover:text-primary transition-colors">
            Explore Artists
          </Link>
          <Link to="/search" className="text-foreground/80 hover:text-primary transition-colors flex items-center gap-1">
            <Search className="h-4 w-4" />
            Search
          </Link>
          
          {user ? (
            <>
              {hasRole('artist') && (
                <Link to="/studio" className="text-foreground/80 hover:text-primary transition-colors">
                  My Studio
                </Link>
              )}
              {hasRole('fan') && (
                <>
                  <Link to="/fan" className="text-foreground/80 hover:text-primary transition-colors">
                    Fan Portal
                  </Link>
                  <Link to="/fan/feed" className="text-foreground/80 hover:text-primary transition-colors">
                    Feed
                  </Link>
                </>
              )}
              {hasRole('admin') && (
                <Link to="/admin" className="text-foreground/80 hover:text-primary transition-colors">
                  Admin
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
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
              <Button 
                variant="ghost" 
                className="text-foreground/80"
                onClick={() => navigate('/auth?mode=fan')}
              >
                <Heart className="h-4 w-4 mr-1" />
                Fan
              </Button>
              <Button 
                className="bg-gradient-gold" 
                onClick={() => navigate('/auth?mode=artist')}
              >
                <Mic2 className="h-4 w-4 mr-1" />
                Artist
              </Button>
            </div>
          )}
        </div>

        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-[hsl(0,0%,6%)] border-border">
              <DropdownMenuItem onClick={() => navigate('/explore')}>
                Explore Artists
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/search')}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </DropdownMenuItem>
              {user ? (
                <>
                  {hasRole('artist') && (
                    <DropdownMenuItem onClick={() => navigate('/studio')}>
                      My Studio
                    </DropdownMenuItem>
                  )}
                  {hasRole('fan') && (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/fan')}>
                        Fan Portal
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/fan/feed')}>
                        Feed
                      </DropdownMenuItem>
                    </>
                  )}
                  {hasRole('admin') && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      Admin
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </>
              ) : (
                <>
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
