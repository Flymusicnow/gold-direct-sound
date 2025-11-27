import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Music, Users, Zap, Mic2, Heart } from "lucide-react";
import heroImage from "@/assets/hero-music.jpg";
import { StatsCounter } from "@/components/StatsCounter";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export default function Home() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ artists: 0, tracks: 0, fans: 0 });

  useEffect(() => {
    async function fetchStats() {
      // Fetch approved artists count
      const { count: artistCount } = await supabase
        .from("artist_profiles")
        .select("*", { count: "exact", head: true })
        .eq("status", "approved");

      // Fetch tracks count
      const { count: trackCount } = await supabase
        .from("tracks")
        .select("*", { count: "exact", head: true });

      // Fetch fans count from user_roles
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
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/90 to-background" />
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 golden-glow-text">
            The New Era of <span className="bg-gradient-gold bg-clip-text text-transparent golden-glow-text">Music</span>
          </h1>
          <p className="text-xl md:text-2xl text-foreground/90 mb-8 max-w-2xl mx-auto">
            Where artists connect directly with superfans. No intermediaries. Just music, passion, and real connection.
          </p>
          <div className="flex flex-col items-center gap-6">
            {/* Primary CTA */}
            <Button 
              size="lg" 
              className="golden-ticket-primary text-primary-foreground text-lg px-10 py-6 font-semibold"
              onClick={() => navigate('/explore')}
            >
              Explore Artists
            </Button>
            
            {/* Two-track entry with visual distinction */}
            <div className="flex flex-col sm:flex-row gap-6 mt-4">
              {/* Artist Track - Gold/Premium styling */}
              <div 
                className="golden-ticket-card flex flex-col items-center p-8 rounded-xl cursor-pointer min-w-[220px]"
                onClick={() => navigate('/auth?mode=artist')}
              >
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mb-3 shadow-gold-soft">
                  <Mic2 className="h-7 w-7 text-primary" />
                </div>
                <span className="font-bold text-primary text-xl mb-2 golden-glow-text">I'm an Artist</span>
                <span className="text-sm text-muted-foreground">Upload & share music</span>
              </div>
              
              {/* Fan Track - Softer/secondary styling */}
              <div 
                className="golden-ticket-card flex flex-col items-center p-8 rounded-xl cursor-pointer min-w-[220px]"
                onClick={() => navigate('/auth?mode=fan')}
              >
                <div className="w-14 h-14 rounded-full bg-foreground/10 flex items-center justify-center mb-3">
                  <Heart className="h-7 w-7 text-foreground/80" />
                </div>
                <span className="font-bold text-foreground text-xl mb-2">I'm a Fan</span>
                <span className="text-sm text-muted-foreground">Discover & support</span>
              </div>
            </div>
          </div>
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
            Why <span className="text-primary">FlyMusic Gold</span>?
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
            Whether you're an artist or a superfan, FlyMusic Gold is your platform.
          </p>
          <Button 
            size="lg" 
            className="bg-gradient-gold text-lg px-8"
            onClick={() => navigate('/auth')}
          >
            Get Started Now
          </Button>
        </div>
      </section>
    </div>
  );
}
