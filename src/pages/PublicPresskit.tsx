import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Mail, 
  MapPin, 
  ExternalLink, 
  Instagram, 
  Twitter,
  Youtube,
  Globe,
  Music,
  Image,
  Video,
  FileImage,
  Loader2,
  ArrowLeft,
  Calendar,
  Briefcase,
  Star,
  Award
} from "lucide-react";
import { FlyMusicLogo } from "@/components/FlyMusicLogo";

export default function PublicPresskit() {
  const { slug } = useParams();

  // Fetch presskit by slug
  const { data: presskit, isLoading, error } = useQuery({
    queryKey: ['public-presskit', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artist_presskits')
        .select(`
          *,
          artist:artist_profiles(
            id,
            artist_name,
            avatar_url,
            bio,
            genre,
            city,
            country,
            instagram_url,
            twitter_url,
            tiktok_url,
            youtube_url,
            website_url,
            user_id
          )
        `)
        .eq('slug', slug)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Fetch media for presskit
  const { data: media = [] } = useQuery({
    queryKey: ['public-presskit-media', presskit?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artist_presskit_media')
        .select('*')
        .eq('presskit_id', presskit?.id)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!presskit?.id,
  });

  // Fetch artist's tracks
  const { data: tracks = [] } = useQuery({
    queryKey: ['artist-tracks', presskit?.artist?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .eq('artist_id', presskit?.artist?.id)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!presskit?.artist?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !presskit) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-2">Press Kit Not Found</h1>
        <p className="text-muted-foreground mb-6">This press kit may have been removed or doesn't exist.</p>
        <Link to="/">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Go Home
          </Button>
        </Link>
      </div>
    );
  }

  const artist = presskit.artist;
  const location = presskit.location || (artist?.city && artist?.country ? `${artist.city}, ${artist.country}` : null);

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'photo': return <Image className="h-5 w-5" />;
      case 'video': return <Video className="h-5 w-5" />;
      case 'audio': return <Music className="h-5 w-5" />;
      case 'logo': return <FileImage className="h-5 w-5" />;
      default: return <Image className="h-5 w-5" />;
    }
  };

  const photoMedia = media.filter(m => m.type === 'photo' || m.type === 'logo');
  const videoMedia = media.filter(m => m.type === 'video');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 py-4">
        <div className="container max-w-5xl mx-auto px-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <FlyMusicLogo size="sm" />
          </Link>
          <Badge variant="outline" className="text-xs">Electronic Press Kit</Badge>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 md:py-20 border-b border-border/30">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Avatar */}
            <Avatar className="h-32 w-32 md:h-40 md:w-40 ring-4 ring-primary/20 flex-shrink-0">
              <AvatarImage src={artist?.avatar_url || ''} />
              <AvatarFallback className="text-3xl bg-gradient-gold text-primary-foreground">
                {artist?.artist_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{artist?.artist_name}</h1>
              {presskit.tagline && (
                <p className="text-xl text-muted-foreground mb-4">{presskit.tagline}</p>
              )}
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                {location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {location}
                  </span>
                )}
                {presskit.contact_email && (
                  <a 
                    href={`mailto:${presskit.contact_email}`}
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    {presskit.contact_email}
                  </a>
                )}
              </div>

              {/* Tags */}
              {presskit.brand_tags && presskit.brand_tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {presskit.brand_tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              )}

              {/* Social Links */}
              <div className="flex flex-wrap gap-3">
                {artist?.instagram_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={artist.instagram_url} target="_blank" rel="noopener noreferrer">
                      <Instagram className="h-4 w-4 mr-2" />
                      Instagram
                    </a>
                  </Button>
                )}
                {artist?.twitter_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={artist.twitter_url} target="_blank" rel="noopener noreferrer">
                      <Twitter className="h-4 w-4 mr-2" />
                      Twitter
                    </a>
                  </Button>
                )}
                {artist?.youtube_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={artist.youtube_url} target="_blank" rel="noopener noreferrer">
                      <Youtube className="h-4 w-4 mr-2" />
                      YouTube
                    </a>
                  </Button>
                )}
                {artist?.website_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={artist.website_url} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4 mr-2" />
                      Website
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="container max-w-5xl mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {/* Bio */}
            {(presskit.bio_short || presskit.bio_long) && (
              <section>
                <h2 className="text-xl font-semibold mb-4">About</h2>
                {presskit.bio_short && (
                  <p className="text-lg text-muted-foreground mb-4">{presskit.bio_short}</p>
                )}
                {presskit.bio_long && (
                  <div className="prose prose-invert max-w-none">
                    <p className="whitespace-pre-wrap">{presskit.bio_long}</p>
                  </div>
                )}
              </section>
            )}

            {/* V2: Availability & Booking */}
            {(presskit.available_for?.length > 0 || presskit.availability_notes) && (
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Availability
                </h2>
                {presskit.available_for?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {presskit.available_for.map((item: string) => (
                      <Badge key={item} variant="outline" className="capitalize">
                        {item.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                )}
                {presskit.availability_notes && (
                  <p className="text-muted-foreground">{presskit.availability_notes}</p>
                )}
              </section>
            )}

            {/* V2: Previous Collaborations */}
            {presskit.previous_collabs && (
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Previous Collaborations
                </h2>
                <Card>
                  <CardContent className="pt-6">
                    <p className="whitespace-pre-wrap text-muted-foreground">{presskit.previous_collabs}</p>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* V2: Achievements */}
            {presskit.achievements_highlights && (
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Notable Achievements
                </h2>
                <Card>
                  <CardContent className="pt-6">
                    <p className="whitespace-pre-wrap text-muted-foreground">{presskit.achievements_highlights}</p>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* Photos */}
            {photoMedia.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4">Press Photos</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {photoMedia.map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative aspect-square rounded-lg overflow-hidden bg-muted border border-border/50 hover:border-primary/50 transition-colors"
                    >
                      <img
                        src={item.url}
                        alt={item.description || 'Press photo'}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ExternalLink className="h-6 w-6 text-white" />
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Videos */}
            {videoMedia.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4">Videos</h2>
                <div className="space-y-3">
                  {videoMedia.map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-muted/30 transition-colors"
                    >
                      <Video className="h-5 w-5 text-primary" />
                      <span className="flex-1">{item.description || 'Video'}</span>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Technical Requirements */}
            {presskit.tech_info && (
              <section>
                <h2 className="text-xl font-semibold mb-4">Technical Requirements</h2>
                <Card>
                  <CardContent className="pt-6">
                    <p className="whitespace-pre-wrap text-muted-foreground">{presskit.tech_info}</p>
                  </CardContent>
                </Card>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Book This Artist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {presskit.contact_email ? (
                  <Button asChild className="w-full">
                    <a href={`mailto:${presskit.contact_email}?subject=Booking Inquiry - ${artist?.artist_name}`}>
                      <Mail className="h-4 w-4 mr-2" />
                      Contact for Booking
                    </a>
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">No booking contact provided</p>
                )}
                
                <Separator />
                
                <Link to={`/artist/${artist?.user_id}`}>
                  <Button variant="outline" className="w-full">
                    View Full Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Experience Level */}
            {presskit.experience_level && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary" />
                    Experience
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary" className="capitalize">
                    {presskit.experience_level} Artist
                  </Badge>
                </CardContent>
              </Card>
            )}

            {/* Recent Tracks */}
            {tracks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Latest Tracks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {tracks.map((track) => (
                      <div key={track.id} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                          {track.cover_url ? (
                            <img src={track.cover_url} alt="" className="w-full h-full object-cover rounded" />
                          ) : (
                            <Music className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{track.title}</p>
                          {track.genre && (
                            <p className="text-xs text-muted-foreground">{track.genre}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8 mt-12">
        <div className="container max-w-5xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <FlyMusicLogo size="sm" />
          </div>
          <p className="text-sm text-muted-foreground">
            Powered by FlyMusic Gold
          </p>
        </div>
      </footer>
    </div>
  );
}
