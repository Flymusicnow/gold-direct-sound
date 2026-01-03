import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

interface CommunityHeaderProps {
  artist: {
    artist_name: string;
    avatar_url: string | null;
    verified?: boolean;
  } | null;
  bannerMediaUrl?: string | null;
  bannerMediaType?: 'image' | 'video' | null;
  isLoading?: boolean;
}

export const CommunityHeader: React.FC<CommunityHeaderProps> = ({
  artist,
  bannerMediaUrl,
  bannerMediaType,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="relative">
        <Skeleton className="w-full aspect-[3/1] rounded-lg" />
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/90 to-transparent">
          <div className="flex items-center gap-3">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="relative w-full aspect-[3/1] rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
        <p className="text-muted-foreground">Community not found</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden">
      {/* Banner */}
      <div className="w-full aspect-[3/1] bg-gradient-to-br from-primary/30 via-primary/10 to-background">
        {bannerMediaUrl && bannerMediaType === 'video' ? (
          <video
            src={bannerMediaUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : bannerMediaUrl ? (
          <img
            src={bannerMediaUrl}
            alt={`${artist.artist_name}'s community banner`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : null}
      </div>

      {/* Artist info overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-background via-background/80 to-transparent">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 md:h-20 md:w-20 border-4 border-background shadow-lg">
            <AvatarImage src={artist.avatar_url || undefined} />
            <AvatarFallback className="text-xl font-bold">
              {artist.artist_name[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold">{artist.artist_name}</h1>
              {artist.verified && (
                <CheckCircle className="h-5 w-5 text-primary fill-primary/20" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">Community</p>
          </div>
        </div>
      </div>
    </div>
  );
};
