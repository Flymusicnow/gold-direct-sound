import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Search as SearchIcon } from 'lucide-react';
import { useSearch } from '@/hooks/useSearch';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { SearchArtistCard } from '@/components/search/SearchArtistCard';
import { SearchTrackCard } from '@/components/search/SearchTrackCard';
import { SearchVideoCard } from '@/components/search/SearchVideoCard';
import { SearchSpotlightCard } from '@/components/search/SearchSpotlightCard';
import { SearchStackCard } from '@/components/search/SearchStackCard';
import { TrendingSearches } from '@/components/search/TrendingSearches';
import { SearchSuggestions } from '@/components/search/SearchSuggestions';
import { RecentSearches } from '@/components/search/RecentSearches';
import { ContentOverlay } from '@/components/fan/ContentOverlay';
import { useFlightdeck } from '@/contexts/FlightdeckContext';

type Category = 'all' | 'tracks' | 'artists' | 'videos' | 'spotlight' | 'stacks';

export default function Search() {
  const navigate = useNavigate();
  const { playNow } = useFlightdeck();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';
  
  const { query, setQuery, results, loading, totalResults } = useSearch(urlQuery);
  const { history, addSearch, clearHistory } = useSearchHistory();
  
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [overlayItem, setOverlayItem] = useState<any>(null);
  const [overlayContext, setOverlayContext] = useState<any[]>([]);

  useEffect(() => {
    if (urlQuery && urlQuery !== query) {
      setQuery(urlQuery);
    }
  }, [urlQuery]);

  useEffect(() => {
    if (query.trim() && query === urlQuery) {
      addSearch(query);
    }
  }, [query, urlQuery]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setShowSuggestions(true);
    if (value.trim()) {
      setSearchParams({ q: value.trim() });
    } else {
      setSearchParams({});
    }
  };

  const handleSuggestionSelect = (type: 'artist' | 'track' | 'video' | 'spotlight', id: string) => {
    setShowSuggestions(false);
    
    if (type === 'artist') {
      navigate(`/artist/${id}`);
    } else if (type === 'track') {
      const track = results.tracks.find(t => t.id === id);
      if (track) {
        playNow({
          id: track.id,
          type: 'track',
          title: track.title,
          artistId: track.artist_profiles.id,
          artistName: track.artist_profiles.artist_name,
          artistUserId: track.artist_profiles.user_id,
          mediaUrl: track.audio_url,
          coverUrl: track.cover_url || undefined,
          spotlightEntryId: track.spotlightEntryId,
          spotlightCampaignId: track.spotlightCampaignId,
        });
      }
    } else if (type === 'video') {
      const video = results.videos.find(v => v.id === id);
      if (video) {
        setOverlayItem({
          id: video.id,
          type: 'video',
          title: video.caption || 'Untitled Video',
          artistId: video.artist_profiles.id,
          artistName: video.artist_profiles.artist_name,
          artistUserId: video.artist_profiles.user_id,
          mediaUrl: video.video_url,
        });
      }
    } else if (type === 'spotlight') {
      navigate(`/spotlight/${id}`);
    }
  };

  const handleTrendingClick = (trendingQuery: string) => {
    setQuery(trendingQuery);
    setSearchParams({ q: trendingQuery });
    setShowSuggestions(false);
  };

  const handleHistoryClick = (historicalQuery: string) => {
    setQuery(historicalQuery);
    setSearchParams({ q: historicalQuery });
    setShowSuggestions(false);
  };

  const filteredResults = {
    artists: activeCategory === 'all' || activeCategory === 'artists' ? results.artists : [],
    tracks: activeCategory === 'all' || activeCategory === 'tracks' ? results.tracks : [],
    videos: activeCategory === 'all' || activeCategory === 'videos' ? results.videos : [],
    spotlightEntries: activeCategory === 'all' || activeCategory === 'spotlight' ? results.spotlightEntries : [],
    stacks: activeCategory === 'all' || activeCategory === 'stacks' ? results.stacks : [],
  };

  const hasFilteredResults = 
    filteredResults.artists.length > 0 ||
    filteredResults.tracks.length > 0 ||
    filteredResults.videos.length > 0 ||
    filteredResults.spotlightEntries.length > 0 ||
    filteredResults.stacks.length > 0;

  const categories: { key: Category; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: totalResults },
    { key: 'tracks', label: 'Tracks', count: results.tracks.length },
    { key: 'artists', label: 'Artists', count: results.artists.length },
    { key: 'videos', label: 'Videos', count: results.videos.length },
    { key: 'spotlight', label: 'Spotlight', count: results.spotlightEntries.length },
    { key: 'stacks', label: 'Stacks', count: results.stacks.length },
  ];

  // Check if artist has spotlight entry
  const artistsWithSpotlight = new Set(
    results.spotlightEntries.map(e => e.tracks.artist_profiles.id)
  );

  return (
    <>
      <div className="min-h-screen pb-24 md:pb-8">
        {/* Sticky Search Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border pt-24 pb-4">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="relative">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Search tracks, artists, videos, spotlight..."
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="pl-10 h-12 text-base search-input-gold"
                  maxLength={100}
                />
              </div>
              
              {/* Live Suggestions */}
              <SearchSuggestions
                results={results}
                query={query}
                onSelect={handleSuggestionSelect}
                isVisible={showSuggestions && query.trim().length > 0}
              />
            </div>
          </div>
        </div>

        <div className="container mx-auto max-w-6xl px-4 pt-6">
          {/* Category Tabs */}
          {query && (
            <div className="mb-6 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
              <div className="flex gap-2 min-w-max md:min-w-0">
                {categories.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                      activeCategory === cat.key
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {cat.label}
                    {cat.count > 0 && (
                      <span className="ml-1.5 opacity-75">({cat.count})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results Summary */}
          {query && !loading && (
            <p className="text-muted-foreground mb-6">
              {totalResults} {totalResults === 1 ? 'result' : 'results'} for "{query}"
            </p>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <SearchIcon className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
              <p className="text-muted-foreground">Searching...</p>
            </div>
          )}

          {/* Empty State - Show Trending & Recent */}
          {!loading && !query && (
            <div className="space-y-8">
              <TrendingSearches onItemClick={handleTrendingClick} />
              <RecentSearches
                history={history}
                onItemClick={handleHistoryClick}
                onClear={clearHistory}
              />
            </div>
          )}

          {/* No Results State */}
          {!loading && query && !hasFilteredResults && (
            <div className="text-center py-12">
              <SearchIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">
                No results found for "{query}"
              </p>
              <p className="text-sm text-muted-foreground">
                Try different keywords or browse trending searches
              </p>
            </div>
          )}

          {/* Results */}
          {!loading && query && hasFilteredResults && (
            <div className="space-y-8">
              {/* Artists */}
              {filteredResults.artists.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">
                    Artists ({filteredResults.artists.length})
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredResults.artists.map((artist) => (
                      <SearchArtistCard
                        key={artist.id}
                        artist={artist}
                        query={query}
                        hasActiveSpotlight={artistsWithSpotlight.has(artist.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Tracks */}
              {filteredResults.tracks.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">
                    Tracks ({filteredResults.tracks.length})
                  </h2>
                  <div className="space-y-3">
                    {filteredResults.tracks.map((track) => (
                      <SearchTrackCard
                        key={track.id}
                        track={track}
                        query={query}
                        onOpenOverlay={() => {
                          setOverlayItem({
                            id: track.id,
                            type: 'track',
                            title: track.title,
                            artistId: track.artist_profiles.id,
                            artistName: track.artist_profiles.artist_name,
                            artistUserId: track.artist_profiles.user_id,
                            mediaUrl: track.audio_url,
                            coverUrl: track.cover_url || undefined,
                            spotlightEntryId: track.spotlightEntryId,
                            spotlightCampaignId: track.spotlightCampaignId,
                          });
                          setOverlayContext(results.tracks.map(t => ({
                            id: t.id,
                            type: 'track' as const,
                            title: t.title,
                            artistId: t.artist_profiles.id,
                            artistName: t.artist_profiles.artist_name,
                            artistUserId: t.artist_profiles.user_id,
                            mediaUrl: t.audio_url,
                            coverUrl: t.cover_url || undefined,
                            spotlightEntryId: t.spotlightEntryId,
                            spotlightCampaignId: t.spotlightCampaignId,
                          })));
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Videos */}
              {filteredResults.videos.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">
                    Videos ({filteredResults.videos.length})
                  </h2>
                  <div className="space-y-3">
                    {filteredResults.videos.map((video) => (
                      <SearchVideoCard
                        key={video.id}
                        video={video}
                        query={query}
                        onOpenOverlay={() => {
                          setOverlayItem({
                            id: video.id,
                            type: 'video',
                            title: video.caption || 'Untitled Video',
                            artistId: video.artist_profiles.id,
                            artistName: video.artist_profiles.artist_name,
                            artistUserId: video.artist_profiles.user_id,
                            mediaUrl: video.video_url,
                          });
                          setOverlayContext(results.videos.map(v => ({
                            id: v.id,
                            type: 'video' as const,
                            title: v.caption || 'Untitled Video',
                            artistId: v.artist_profiles.id,
                            artistName: v.artist_profiles.artist_name,
                            artistUserId: v.artist_profiles.user_id,
                            mediaUrl: v.video_url,
                          })));
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Spotlight Entries */}
              {filteredResults.spotlightEntries.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">
                    Spotlight ({filteredResults.spotlightEntries.length})
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {filteredResults.spotlightEntries.map((entry) => (
                      <SearchSpotlightCard
                        key={entry.id}
                        entry={entry}
                        query={query}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Stacks */}
              {filteredResults.stacks.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">
                    Stacks ({filteredResults.stacks.length})
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredResults.stacks.map((stack) => (
                      <SearchStackCard
                        key={stack.id}
                        stack={stack}
                        query={query}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content Overlay */}
      {overlayItem && (
        <ContentOverlay
          item={overlayItem}
          items={overlayContext}
          currentIndex={overlayContext.findIndex(item => item.id === overlayItem.id)}
          isOpen={!!overlayItem}
          onClose={() => setOverlayItem(null)}
          onIndexChange={(index) => setOverlayItem(overlayContext[index])}
        />
      )}
    </>
  );
}
