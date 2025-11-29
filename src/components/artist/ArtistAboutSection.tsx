import { Instagram, Twitter, Globe, Youtube, Music } from "lucide-react";

const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

interface ArtistAboutSectionProps {
  artist: {
    bio: string | null;
    instagram_url: string | null;
    tiktok_url: string | null;
    youtube_url: string | null;
    twitter_url: string | null;
    website_url: string | null;
  };
}

export function ArtistAboutSection({ artist }: ArtistAboutSectionProps) {
  const socialLinks = [
    { url: artist.instagram_url, icon: Instagram, label: "Instagram" },
    { url: artist.tiktok_url, icon: TikTokIcon, label: "TikTok" },
    { url: artist.youtube_url, icon: Youtube, label: "YouTube" },
    { url: artist.twitter_url, icon: Twitter, label: "Twitter" },
    { url: artist.website_url, icon: Globe, label: "Website" },
  ].filter(link => link.url);

  const hasBio = artist.bio && artist.bio.trim();
  const hasSocialLinks = socialLinks.length > 0;

  if (!hasBio && !hasSocialLinks) {
    return (
      <div className="text-center py-12">
        <Music className="h-12 w-12 text-primary/30 mx-auto mb-4" />
        <p className="text-muted-foreground text-lg">This artist hasn't added their story yet.</p>
        <p className="text-muted-foreground/60 text-sm mt-2">Check back soon for updates!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Bio Section */}
      {hasBio && (
        <div>
          <h3 className="text-xl font-semibold mb-4">About</h3>
          <p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-wrap max-w-3xl">
            {artist.bio}
          </p>
        </div>
      )}

      {/* Social Links */}
      {hasSocialLinks && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Connect</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {socialLinks.map((link, index) => {
              const Icon = link.icon;
              return (
                <a
                  key={index}
                  href={link.url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                  <Icon className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                  <span className="font-medium">{link.label}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
