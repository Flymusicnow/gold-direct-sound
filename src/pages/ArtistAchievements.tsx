import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, ArrowLeft, Share2, Home, Music2 } from "lucide-react";
import { usePublicAchievements } from "@/hooks/usePublicAchievements";
import { AchievementBadge } from "@/components/artist/AchievementBadge";
import { Badge } from "@/components/ui/badge";
import { ShareModal } from "@/components/ShareModal";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { isValidUUID } from "@/lib/utils/validation";
import { useMetaTags } from "@/hooks/useMetaTags";

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

type ErrorState = 'invalid' | 'not_found' | 'fetch' | null;

export default function ArtistAchievements() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorState>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const { achievements, loading: achievementsLoading } = usePublicAchievements(userId);

  // Calculate stats for meta tags
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;
  const progressPercentage = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  // Set Open Graph meta tags for social sharing
  useMetaTags(artist ? {
    title: `${artist.artist_name}'s Achievements | FlyMusic Gold`,
    description: `Check out ${artist.artist_name}'s ${unlockedCount} unlocked achievements on FlyMusic Gold. ${progressPercentage}% profile completion!`,
    image: artist.avatar_url || '/flymusic-logo.png',
    type: 'profile',
  } : null);

  useEffect(() => {
    // Validate UUID before making any requests
    if (!userId) {
      setError('invalid');
      setLoading(false);
      return;
    }

    if (!isValidUUID(userId)) {
      setError('invalid');
      setLoading(false);
      return;
    }

    fetchArtist();
  }, [userId]);

  const fetchArtist = async () => {
    if (!userId) return;

    try {
      // First try by user_id (the expected case)
      let { data, error: queryError } = await supabase
        .from('artist_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      // If not found by user_id, try by artist_profiles.id (for links using profile ID)
      if (!data && !queryError) {
        const result = await supabase
          .from('artist_profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        data = result.data;
        queryError = result.error;
      }

      if (queryError) {
        console.error('Error fetching artist:', queryError);
        setError('fetch');
      } else if (!data) {
        setError('not_found');
      } else {
        setArtist(data);
        setError(null);
      }
    } catch (err) {
      console.error('Unexpected error fetching artist:', err);
      setError('fetch');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Error: Invalid UUID format
  if (error === 'invalid') {
    return (
      <div className="min-h-screen pt-16 flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
            <Music2 className="h-10 w-10 text-destructive opacity-50" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Invalid artist link</h2>
          <p className="text-muted-foreground mb-6">
            This link appears to be invalid. Please check the URL and try again.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
            <Button
              onClick={() => navigate('/explore')}
              className="gap-2 bg-primary"
            >
              <Home className="h-4 w-4" />
              Explore Artists
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Error: Artist not found
  if (error === 'not_found' || !artist) {
    return (
      <div className="min-h-screen pt-16 flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
            <Music2 className="h-10 w-10 text-muted-foreground opacity-50" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Artist not found</h2>
          <p className="text-muted-foreground mb-6">
            This artist may have been removed or the link is incorrect.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
            <Button
              onClick={() => navigate('/studio')}
              className="gap-2"
            >
              <Music2 className="h-4 w-4" />
              Go to My Studio
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Error: Fetch error
  if (error === 'fetch') {
    return (
      <div className="min-h-screen pt-16 flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
            <Music2 className="h-10 w-10 text-destructive opacity-50" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Error loading artist</h2>
          <p className="text-muted-foreground mb-6">
            Something went wrong. Please try again.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
            <Button
              onClick={() => window.location.reload()}
              className="gap-2 bg-primary"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 pb-32">
      {/* Header Section */}
      <div className="bg-gradient-dark border-b border-border">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Link to={`/artist/${artist.user_id}`}>
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

            <div>
              <h1 className="text-3xl font-bold mb-2">{artist.artist_name}</h1>
              <div className="flex items-center gap-2 mb-4">
                <p className="text-muted-foreground">Achievement Showcase</p>
                <InfoTooltip
                  title="Artist Achievements"
                  description="Achievements unlock as you reach milestones: upload tracks/videos, gain followers, earn plays, and engage with fans."
                  forRole="artist"
                  learnLink="/learn?tab=artist#studio-overview"
                />
              </div>

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
