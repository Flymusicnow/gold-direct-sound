import { Card } from '@/components/ui/card';
import { Music2, Mic2, Video, Sparkles } from 'lucide-react';
import { SearchResultHighlight } from './SearchResultHighlight';
import type { SearchResults } from '@/hooks/useSearch';

interface SearchSuggestionsProps {
  results: SearchResults;
  query: string;
  onSelect: (type: 'artist' | 'track' | 'video' | 'spotlight', id: string) => void;
  isVisible: boolean;
}

export function SearchSuggestions({ results, query, onSelect, isVisible }: SearchSuggestionsProps) {
  if (!isVisible || !query.trim()) {
    return null;
  }

  const hasResults = 
    results.artists.length > 0 ||
    results.tracks.length > 0 ||
    results.videos.length > 0 ||
    results.spotlightEntries.length > 0;

  if (!hasResults) {
    return null;
  }

  return (
    <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-[400px] overflow-y-auto dropdown-solid">
      <div className="p-2">
        {/* Artists */}
        {results.artists.slice(0, 3).map((artist) => (
          <div
            key={`artist-${artist.id}`}
            className="px-3 py-2 rounded-md hover:bg-accent/10 cursor-pointer transition-colors flex items-center gap-3"
            onClick={() => onSelect('artist', artist.user_id)}
          >
            <Mic2 className="h-4 w-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                <SearchResultHighlight text={artist.artist_name} query={query} />
              </p>
              {artist.genre && (
                <p className="text-xs text-muted-foreground truncate">
                  {artist.genre}
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Tracks */}
        {results.tracks.slice(0, 3).map((track) => (
          <div
            key={`track-${track.id}`}
            className="px-3 py-2 rounded-md hover:bg-accent/10 cursor-pointer transition-colors flex items-center gap-3"
            onClick={() => onSelect('track', track.id)}
          >
            <Music2 className="h-4 w-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                <SearchResultHighlight text={track.title} query={query} />
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {track.artist_profiles.artist_name}
              </p>
            </div>
          </div>
        ))}

        {/* Videos */}
        {results.videos.slice(0, 2).map((video) => (
          <div
            key={`video-${video.id}`}
            className="px-3 py-2 rounded-md hover:bg-accent/10 cursor-pointer transition-colors flex items-center gap-3"
            onClick={() => onSelect('video', video.id)}
          >
            <Video className="h-4 w-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {video.caption ? (
                  <SearchResultHighlight text={video.caption} query={query} />
                ) : (
                  'Video'
                )}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {video.artist_profiles.artist_name}
              </p>
            </div>
          </div>
        ))}

        {/* Spotlight Entries */}
        {results.spotlightEntries.slice(0, 2).map((entry) => (
          <div
            key={`spotlight-${entry.id}`}
            className="px-3 py-2 rounded-md hover:bg-accent/10 cursor-pointer transition-colors flex items-center gap-3"
            onClick={() => onSelect('spotlight', entry.campaign_id)}
          >
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                <SearchResultHighlight 
                  text={entry.title || entry.tracks.title} 
                  query={query} 
                />
              </p>
              <p className="text-xs text-muted-foreground truncate">
                Spotlight • {entry.total_votes} votes
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
