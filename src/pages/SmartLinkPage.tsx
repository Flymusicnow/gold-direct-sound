import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FlyMusicLogo } from "@/components/FlyMusicLogo";
import { Music, ExternalLink, Play, Loader2, Instagram, Youtube, Twitter, Globe } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type SmartLinkPageRow = Database['public']['Tables']['smart_link_pages']['Row'];
type ExternalLinkRow = Database['public']['Tables']['smart_link_external_links']['Row'];

interface SmartLinkData extends SmartLinkPageRow {
  artist_profiles: {
    id: string;
    artist_name: string;
    avatar_url: string | null;
    bio: string | null;
    genre: string | null;
  };
}

export default function SmartLinkPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<SmartLinkData | null>(null);
  const [links, setLinks] = useState<ExternalLinkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchSmartLink();
    }
  }, [slug]);

  const fetchSmartLink = async () => {
    setLoading(true);
    try {
      // Fetch smart link page with artist info
      const { data: pageData, error } = await supabase
        .from('smart_link_pages')
        .select(`
          *,
          artist_profiles (
            id,
            artist_name,
            avatar_url,
            bio,
            genre
          )
        `)
        .eq('slug', slug)
        .eq('status', 'active')
        .maybeSingle();

      if (error || !pageData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setData(pageData as SmartLinkData);

      // Fetch external links (only active ones)
      const { data: linksData } = await supabase
        .from('smart_link_external_links')
        .select('*')
        .eq('smart_link_page_id', pageData.id)
        .eq('status', 'active')
        .order('sort_order', { ascending: true });

      setLinks(linksData || []);
    } catch (error) {
      console.error('Error fetching smart link:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkClick = async (linkId: string, url: string) => {
    // Track click - increment click_count directly
    await supabase
      .from('smart_link_external_links')
      .update({ click_count: links.find(l => l.id === linkId)?.click_count || 0 + 1 })
      .eq('id', linkId);
    
    // Open link
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <Instagram className="h-5 w-5" />;
      case 'youtube':
      case 'youtube_music':
        return <Youtube className="h-5 w-5" />;
      case 'twitter':
        return <Twitter className="h-5 w-5" />;
      default:
        return <Music className="h-5 w-5" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'spotify':
        return 'bg-[#1DB954] hover:bg-[#1ed760]';
      case 'apple_music':
        return 'bg-gradient-to-r from-[#FC3C44] to-[#FA2D48] hover:opacity-90';
      case 'youtube':
      case 'youtube_music':
        return 'bg-[#FF0000] hover:bg-[#cc0000]';
      case 'soundcloud':
        return 'bg-[#FF5500] hover:bg-[#ff6a1a]';
      case 'instagram':
        return 'bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] hover:opacity-90';
      case 'tiktok':
        return 'bg-black hover:bg-gray-900';
      case 'twitter':
        return 'bg-black hover:bg-gray-900';
      default:
        return 'bg-primary hover:bg-primary/90';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex flex-col items-center justify-center p-4">
        <Globe className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Link Not Found</h1>
        <p className="text-muted-foreground mb-6">This smart link doesn't exist or has been disabled.</p>
        <Button asChild>
          <Link to="/">Go to FlyMusic</Link>
        </Button>
      </div>
    );
  }

  const artist = data.artist_profiles;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/50">
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Artist Header */}
        <div className="text-center mb-8">
          <Avatar className="w-24 h-24 mx-auto mb-4 ring-4 ring-primary/20">
            <AvatarImage src={artist.avatar_url || undefined} alt={artist.artist_name} />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary">
              {artist.artist_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <h1 className="text-2xl font-bold mb-1">{artist.artist_name}</h1>
          
          {artist.genre && (
            <p className="text-sm text-primary font-medium mb-2">{artist.genre}</p>
          )}
          
          {artist.bio && (
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              {artist.bio}
            </p>
          )}
        </div>

        {/* Listen on FlyMusic CTA */}
        <div className="mb-6">
          <Button
            asChild
            size="lg"
            className="w-full bg-gradient-gold text-primary-foreground font-semibold shadow-gold"
          >
            <Link to={`/artist/${artist.id}`}>
              <Play className="h-5 w-5 mr-2" />
              Listen on FlyMusic
            </Link>
          </Button>
        </div>

        {/* External Links */}
        {links.length > 0 && (
          <div className="space-y-3">
            {links.map((link) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id, link.url)}
                className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-white font-medium transition-all duration-200 ${getPlatformColor(link.platform)}`}
              >
                {getPlatformIcon(link.platform)}
                <span className="capitalize">{link.platform.replace('_', ' ')}</span>
                <ExternalLink className="h-4 w-4 ml-auto opacity-60" />
              </button>
            ))}
          </div>
        )}

        {/* FlyMusic Branding */}
        <div className="mt-12 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <FlyMusicLogo size="sm" />
            <span className="text-sm">Powered by FlyMusic</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
