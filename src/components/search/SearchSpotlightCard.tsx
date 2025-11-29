import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp } from 'lucide-react';
import { SearchResultHighlight } from './SearchResultHighlight';
import { useSpotlightVote } from '@/hooks/useSpotlightVote';
import type { SearchSpotlightEntry } from '@/hooks/useSearch';

interface SearchSpotlightCardProps {
  entry: SearchSpotlightEntry;
  query: string;
}

export function SearchSpotlightCard({ entry, query }: SearchSpotlightCardProps) {
  const navigate = useNavigate();
  const { hasVoted, isVoting, toggleVote } = useSpotlightVote(
    entry.id,
    entry.campaign_id,
    entry.tracks.artist_profiles.id,
    false
  );

  const handleVoteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleVote();
  };

  return (
    <Card
      className="hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer spotlight-glow-gold"
      onClick={() => navigate(`/spotlight/${entry.campaign_id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Track Cover with Rank Badge */}
          <div className="relative w-16 h-16 flex-shrink-0">
            {entry.tracks.cover_url ? (
              <img
                src={entry.tracks.cover_url}
                alt={entry.tracks.title}
                className="w-full h-full rounded-lg object-cover border-2 border-primary/40"
              />
            ) : (
              <div className="w-full h-full rounded-lg bg-primary/10 flex items-center justify-center border-2 border-primary/40">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
            )}
            {entry.cached_rank && entry.cached_rank <= 20 && (
              <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground px-2 py-0.5 text-xs font-bold">
                #{entry.cached_rank}
              </Badge>
            )}
          </div>

          {/* Entry Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate mb-1">
              <SearchResultHighlight 
                text={entry.title || entry.tracks.title} 
                query={query} 
              />
            </h3>
            <p className="text-sm text-muted-foreground truncate mb-2">
              by <SearchResultHighlight 
                text={entry.tracks.artist_profiles.artist_name} 
                query={query} 
              />
            </p>

            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-1 text-sm text-primary">
                <TrendingUp className="h-4 w-4" />
                <span className="font-semibold">{entry.total_votes}</span>
                <span className="text-muted-foreground">votes</span>
              </div>
            </div>

            <Button
              size="sm"
              variant={hasVoted ? 'secondary' : 'default'}
              onClick={handleVoteClick}
              disabled={isVoting}
              className="w-full"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              {hasVoted ? 'Voted' : 'Vote Now'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
