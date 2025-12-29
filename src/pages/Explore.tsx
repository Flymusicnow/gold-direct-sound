import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, ArrowLeft } from "lucide-react";
import { BottomNavBarFan } from "@/components/mobile/BottomNavBarFan";
import { useIsMobile } from "@/hooks/use-mobile";

interface Artist {
  id: string;
  user_id: string;
  artist_name: string;
  bio: string | null;
  genre: string | null;
  avatar_url: string | null;
}

export default function Explore() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  // Smart back navigation - go to previous fan page or default to /fan/feed
  const handleBack = () => {
    // Check if we can go back in history and came from a fan route
    const referrer = document.referrer;
    if (referrer && (referrer.includes('/fan') || window.history.length > 1)) {
      navigate(-1);
    } else {
      navigate('/fan/feed');
    }
  };

  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    const { data, error } = await supabase
      .from('artist_profiles')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching artists:', error);
    } else {
      setArtists(data || []);
    }
    setLoading(false);
  };

  const filteredArtists = artists.filter(artist =>
    artist.artist_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    artist.genre?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">{t('discover.loadingArtists')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen py-24 px-4 pb-32 md:pb-28">
      {/* Back button header */}
      <div className="fixed top-6 left-6 z-20">
        <button 
          onClick={handleBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
      </div>

      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">
            {t('discover.title')} <span className="text-primary">{t('discover.artists')}</span>
          </h1>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={t('discover.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredArtists.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('discover.noArtistsFound')}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArtists.map((artist) => (
              <Card
                key={artist.id}
                className="p-6 hover:border-primary/50 transition-all cursor-pointer"
                onClick={() => navigate(`/artist/${artist.user_id}`)}
              >
                <div className="flex items-center gap-4 mb-4">
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
                    <h3 className="font-semibold text-lg">{artist.artist_name}</h3>
                    {artist.genre && (
                      <p className="text-sm text-muted-foreground">{artist.genre}</p>
                    )}
                  </div>
                </div>
                {artist.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {artist.bio}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
      </div>
      {isMobile && <BottomNavBarFan />}
    </>
  );
}
