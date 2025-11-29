import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, ArrowLeft, Share2 } from "lucide-react";
import { usePublicAchievements } from "@/hooks/usePublicAchievements";
import { AchievementBadge } from "@/components/artist/AchievementBadge";
import { Badge } from "@/components/ui/badge";
import { ShareModal } from "@/components/ShareModal";

interface Artist {
  id: string;
  user_id: string;
  artist_name: string;
  bio: string | null;
  genre: string | null;
  city: string | null;
  country: string | null;
  avatar_url: string | null;
}

export default function ArtistAchievements() {
  const { userId } = useParams();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const { achievements, loading: achievementsLoading } = usePublicAchievements(userId);

  useEffect(() => {
    if (userId) {
      fetchArtist();
    }
  }, [userId]);

  const fetchArtist = async () => {
    const { data, error } = await supabase
      .from('artist_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching artist:', error);
    } else {
      setArtist(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <p className="text-muted-foreground">Artist not found</p>
      </div>
    );
  }

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;
  const progressPercentage = Math.round((unlockedCount / totalCount) * 100);

  return (
    <div className="min-h-screen pt-16 pb-32">
      {/* Header Section */}
      <div className="bg-gradient-dark border-b border-border">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Link to={`/artist/${userId}`}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Button>
          </Link>

          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="relative flex-shrink-0">
              <div className="w-32 h-32 rounded-full ring-4 ring-primary/30 overflow-hidden">
                {artist.avatar_url ? (
                  <img
                    src={artist.avatar_url}
                    alt={artist.artist_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    <span className="text-5xl text-primary font-bold">
                      {artist.artist_name[0]}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{artist.artist_name}</h1>
              <p className="text-muted-foreground mb-4">Achievement Showcase</p>

              {artist.genre && (
                <Badge className="bg-primary/10 text-primary border-primary hover:bg-primary/20 mb-4">
                  {artist.genre}
                </Badge>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowShareModal(true)}
                  variant="outline"
                  className="border-primary/50 hover:border-primary hover:bg-primary/10"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Achievements
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Banner */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="border-primary/20 bg-gradient-dark">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">{unlockedCount}</div>
                <div className="text-sm text-muted-foreground">Achievements Unlocked</div>
              </div>
              
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">{progressPercentage}%</div>
                <div className="text-sm text-muted-foreground">Profile Complete</div>
              </div>
              
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">{totalCount - unlockedCount}</div>
                <div className="text-sm text-muted-foreground">To Unlock</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-gold transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievement Showcase */}
      <div className="container mx-auto px-4 pb-8 max-w-6xl">
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Award className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Achievement Gallery</CardTitle>
                <CardDescription>
                  {unlockedCount === 0 
                    ? "Start your journey to unlock achievements"
                    : `${artist.artist_name} has unlocked ${unlockedCount} out of ${totalCount} achievements`
                  }
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {achievementsLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading achievements...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {achievements.map((achievement) => (
                  <div key={achievement.type} className="flex flex-col items-center">
                    <AchievementBadge
                      icon={achievement.icon}
                      name={achievement.name}
                      description={achievement.description}
                      unlocked={achievement.unlocked}
                      unlockedAt={achievement.unlockedAt}
                    />
                  </div>
                ))}
              </div>
            )}

            {unlockedCount === 0 && (
              <div className="text-center mt-8">
                <p className="text-sm text-muted-foreground">
                  This artist is just getting started. Check back soon to see their achievements!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        artistName={artist.artist_name}
        shareUrl={window.location.href}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  );
}
