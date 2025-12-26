import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  TrendingUp, 
  Users, 
  Music,
  ArrowRight,
  Sparkles
} from "lucide-react";

interface ArtistProfile {
  id: string;
  user_id: string;
  artist_name: string;
  avatar_url: string | null;
  genre: string | null;
  bio: string | null;
  follower_count?: number;
}

export default function TopArtists() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [artists, setArtists] = useState<ArtistProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopArtists();
  }, []);

  const fetchTopArtists = async () => {
    try {
      // Fetch approved artists
      const { data: artistsData, error: artistsError } = await supabase
        .from('artist_profiles')
        .select('id, user_id, artist_name, avatar_url, genre, bio')
        .eq('status', 'approved')
        .limit(20);

      if (artistsError) throw artistsError;

      // Fetch follower counts for each artist
      const artistsWithCounts = await Promise.all(
        (artistsData || []).map(async (artist) => {
          const { count } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('artist_id', artist.id);
          
          return {
            ...artist,
            follower_count: count || 0
          };
        })
      );

      // Sort by follower count
      artistsWithCounts.sort((a, b) => (b.follower_count || 0) - (a.follower_count || 0));
      
      setArtists(artistsWithCounts);
    } catch (error) {
      console.error('Error fetching top artists:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="container mx-auto px-4 text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t('topArtists.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('topArtists.subtitle')}
          </p>
        </section>

        {/* Artists Grid */}
        <section className="container mx-auto px-4 mb-16">
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="bg-card/50 border-border">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <Skeleton className="w-24 h-24 rounded-full mb-4" />
                      <Skeleton className="h-6 w-32 mb-2" />
                      <Skeleton className="h-4 w-24 mb-4" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : artists.length === 0 ? (
            <div className="text-center py-16">
              <Music className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('topArtists.noArtistsYet')}</h3>
              <p className="text-muted-foreground mb-6">{t('topArtists.checkBackSoon')}</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {artists.map((artist, index) => (
                <Link key={artist.id} to={`/artist/${artist.user_id}`}>
                  <Card className="bg-card/50 border-border hover:border-primary/30 transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer group">
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center">
                        {index < 3 && (
                          <Badge 
                            className={`absolute top-3 right-3 ${
                              index === 0 ? 'bg-yellow-500' : 
                              index === 1 ? 'bg-gray-400' : 
                              'bg-amber-700'
                            }`}
                          >
                            #{index + 1}
                          </Badge>
                        )}
                        <Avatar className="w-24 h-24 mb-4 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                          <AvatarImage src={artist.avatar_url || undefined} />
                          <AvatarFallback className="text-2xl bg-primary/10">
                            {artist.artist_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                          {artist.artist_name}
                        </h3>
                        {artist.genre && (
                          <Badge variant="secondary" className="mt-2 mb-3">
                            {artist.genre}
                          </Badge>
                        )}
                        <div className="flex items-center gap-1 text-muted-foreground text-sm">
                          <Users className="h-4 w-4" />
                          <span>{artist.follower_count?.toLocaleString() || 0} {t('topArtists.followers')}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 text-center">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="py-12">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-3">{t('topArtists.ctaTitle')}</h2>
              <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                {t('topArtists.ctaDescription')}
              </p>
              <Button onClick={() => navigate('/auth')} className="bg-gradient-gold">
                {t('topArtists.createAccount')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
}
