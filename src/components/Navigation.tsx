import { Link, useNavigate } from "react-router-dom";
import { Music, User, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Navigation = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-primary font-bold text-xl">
          <Music className="h-6 w-6" />
          <span className="bg-gradient-gold bg-clip-text text-transparent">FlyMusic Gold</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link to="/explore" className="text-foreground/80 hover:text-primary transition-colors">
            Explore Artists
          </Link>
          
          {user ? (
            <>
              {profile?.role === 'artist' && (
                <Link to="/studio" className="text-foreground/80 hover:text-primary transition-colors">
                  My Studio
                </Link>
              )}
              {profile?.role === 'fan' && (
                <Link to="/dashboard" className="text-foreground/80 hover:text-primary transition-colors">
                  Dashboard
                </Link>
              )}
              {profile?.role === 'admin' && (
                <Link to="/admin" className="text-foreground/80 hover:text-primary transition-colors">
                  Admin
                </Link>
              )}
              
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
              <Button className="bg-gradient-gold" onClick={() => navigate('/auth?mode=artist')}>
                Join as Artist
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
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate('/explore')}>
                Explore Artists
              </DropdownMenuItem>
              {user ? (
                <>
                  {profile?.role === 'artist' && (
                    <DropdownMenuItem onClick={() => navigate('/studio')}>
                      My Studio
                    </DropdownMenuItem>
                  )}
                  {profile?.role === 'fan' && (
                    <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                      Dashboard
                    </DropdownMenuItem>
                  )}
                  {profile?.role === 'admin' && (
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
                  <DropdownMenuItem onClick={() => navigate('/auth?mode=artist')}>
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
