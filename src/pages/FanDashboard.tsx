import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Heart } from "lucide-react";

interface Artist {
  id: string;
  user_id: string;
  artist_name: string;
  avatar_url: string | null;
}

export default function FanDashboard() {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [followedArtists, setFollowedArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchFollowedArtists();
  }, [user, navigate]);

  const fetchFollowedArtists = async () => {
    if (!user) return;

    const { data: follows } = await supabase
      .from('follows')
      .select(`
        artist_id,
        artist_profiles (
          id,
          user_id,
          artist_name,
          avatar_url
        )
      `)
      .eq('fan_id', user.id);

    if (follows) {
      const artists = follows.map((f: any) => f.artist_profiles).filter(Boolean);
      setFollowedArtists(artists);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-24 px-4">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold mb-8">{t('fan.yourDashboard')}</h1>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            {t('fan.following')}
          </h2>
          
          {followedArtists.length === 0 ? (
            <p className="text-muted-foreground">{t('fan.notFollowingAnyArtists')}</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {followedArtists.map((artist) => (
                <Card
                  key={artist.id}
                  className="p-6 hover:border-primary/50 transition-all cursor-pointer"
                  onClick={() => navigate(`/artist/${artist.user_id}`)}
                >
                  <div className="flex items-center gap-4">
                    {artist.avatar_url ? (
                      <img
                        src={artist.avatar_url}
                        alt={artist.artist_name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-2xl text-primary font-bold">
                          {artist.artist_name[0]}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold">{artist.artist_name}</h3>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
