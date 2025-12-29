import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Music, Users, Zap, Mic2, Heart, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import heroImage from "@/assets/hero-music.jpg";
import { StatsCounter } from "@/components/StatsCounter";
import { supabase } from "@/integrations/supabase/client";
import { Footer } from "@/components/Footer";

/**
 * Home.tsx - SUPER CARD compliant
 * 
 * NO auto-redirects for logged-in users.
 * Shows beta-info with clear paths: Fan | Artist
 * flymusic.se is NOT used for beta entry - just info.
 */
export default function Home() {
  const navigate = useNavigate();
  const { user, hasRole, signOut } = useAuth();
  const [stats, setStats] = useState({ artists: 0, tracks: 0, fans: 0 });

  // Determine dashboard path based on user role
  const getDashboardPath = () => {
    if (hasRole('admin')) return '/admin';
    if (hasRole('brand')) return '/brand';
    if (hasRole('artist')) return '/studio';
    if (hasRole('fan')) return '/fan/feed';
    return '/';
  };

  useEffect(() => {
    async function fetchStats() {
      const { count: artistCount } = await supabase
        .from("artist_profiles")
        .select("*", { count: "exact", head: true })
        .eq("status", "approved");

      const { count: trackCount } = await supabase
        .from("tracks")
        .select("*", { count: "exact", head: true });

      const { count: fanCount } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "fan");

      setStats({
        artists: artistCount || 0,
        tracks: trackCount || 0,
        fans: fanCount || 0,
      });
    }
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            The New Era of <span className="bg-gradient-gold bg-clip-text text-transparent">Music</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Where artists connect directly with superfans. No intermediaries. Just music, passion, and real connection.
          </p>
          
          {/* Show different content based on auth state */}
          {user ? (
            /* Authenticated user - show dashboard + sign out */
            <div className="flex flex-col items-center gap-6">
              <p className="text-lg text-muted-foreground">
                Welcome back! You're signed in.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg"
                  className="bg-gradient-gold min-w-[180px]"
                  onClick={() => navigate(getDashboardPath())}
                >
                  <LayoutDashboard className="h-5 w-5 mr-2" />
                  Go to Dashboard
                </Button>
                
                <Button 
                  size="lg"
                  variant="outline"
                  className="min-w-[180px]"
                  onClick={signOut}
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          ) : (
            /* Not authenticated - show beta access paths */
            <div className="flex flex-col items-center gap-6">
              <p className="text-lg text-muted-foreground">
                FlyMusic is currently in <span className="text-primary font-medium">invite-only beta</span>
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Fan path */}
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-violet-500/50 text-violet-400 hover:bg-violet-500/10 hover:border-violet-500 min-w-[180px]"
                  onClick={() => navigate('/fan')}
                >
                  <Heart className="h-5 w-5 mr-2" />
                  I'm a Fan
                </Button>
                
                {/* Artist path */}
                <Button 
                  size="lg" 
                  className="bg-gradient-gold min-w-[180px]"
                  onClick={() => navigate('/artist')}
                >
                  <Mic2 className="h-5 w-5 mr-2" />
                  I'm an Artist
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <button 
                  onClick={() => navigate('/signin/fan')}
                  className="text-violet-400 hover:underline"
                >
                  Sign in as Fan
                </button>
                {' · '}
                <button 
                  onClick={() => navigate('/signin/artist')}
                  className="text-primary hover:underline"
                >
                  Sign in as Artist
                </button>
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 px-4 border-y border-border/50 bg-gradient-to-b from-background to-background/95">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StatsCounter 
              icon={Mic2} 
              value={stats.artists} 
              label="Artists" 
              suffix="+"
            />
            <StatsCounter 
              icon={Music} 
              value={stats.tracks} 
              label="Tracks" 
              suffix="+"
            />
            <StatsCounter 
              icon={Heart} 
              value={stats.fans} 
              label="Superfans" 
              suffix="+"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Why <span className="text-primary">FlyMusic</span>?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-xl bg-card border border-border hover:border-primary/50 transition-all">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                <Music className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Direct Connection</h3>
              <p className="text-muted-foreground">
                Artists own their audience. No algorithms deciding who sees your music.
              </p>
            </div>

            <div className="text-center p-8 rounded-xl bg-card border border-border hover:border-primary/50 transition-all">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Superfans First</h3>
              <p className="text-muted-foreground">
                Built for true fans who want to support artists directly and meaningfully.
              </p>
            </div>

            <div className="text-center p-8 rounded-xl bg-card border border-border hover:border-primary/50 transition-all">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Independent Power</h3>
              <p className="text-muted-foreground">
                Moving away from streaming services to a platform artists truly control.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-dark">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Join the Movement?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Whether you're an artist or a superfan, FlyMusic is your platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="outline"
              className="border-violet-500/50 text-violet-400 hover:bg-violet-500/10"
              onClick={() => navigate('/fan')}
            >
              Join as Fan
            </Button>
            <Button 
              size="lg" 
              className="bg-gradient-gold"
              onClick={() => navigate('/artist')}
            >
              Join as Artist
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
