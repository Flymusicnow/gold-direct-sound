import { Card, CardContent } from '@/components/ui/card';
import { Video } from 'lucide-react';
import { SearchResultHighlight } from './SearchResultHighlight';
import { FanActionBar } from '@/components/fan/FanActionBar';
import type { SearchVideo } from '@/hooks/useSearch';

interface SearchVideoCardProps {
  video: SearchVideo;
  query: string;
  onOpenOverlay?: () => void;
}

export function SearchVideoCard({ video, query, onOpenOverlay }: SearchVideoCardProps) {
  const flightdeckItem = {
    id: video.id,
    type: 'video' as const,
    title: video.caption || 'Untitled Video',
    artistId: video.artist_profiles.id,
    artistName: video.artist_profiles.artist_name,
    artistUserId: video.artist_profiles.user_id,
    mediaUrl: video.video_url,
  };

  return (
    <Card className="hover:shadow-lg hover:border-primary/30 transition-all group">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Video Thumbnail */}
          <div 
            className="w-24 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0 cursor-pointer relative"
            onClick={onOpenOverlay}
          >
            <video
              src={video.video_url}
              className="w-full h-full object-cover"
              preload="metadata"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/30 transition-colors">
              <Video className="h-6 w-6 text-white" />
            </div>
          </div>

          {/* Video Info & Actions */}
          <div className="flex-1 min-w-0">
            <div 
              className="cursor-pointer mb-2"
              onClick={onOpenOverlay}
            >
              <p className="text-sm text-muted-foreground line-clamp-2">
                {video.caption ? (
                  <SearchResultHighlight text={video.caption} query={query} />
                ) : (
                  'No caption'
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                by {video.artist_profiles.artist_name}
              </p>
            </div>

            <FanActionBar
              item={flightdeckItem}
              variant="compact"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
