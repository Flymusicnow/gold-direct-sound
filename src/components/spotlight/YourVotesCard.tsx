import { formatDistanceToNow } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, Heart, Sparkles, ArrowUp, ArrowDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { VotedEntry } from "@/contexts/SpotlightVoteContext";

interface YourVotesCardProps {
  entry: VotedEntry;
}

export function YourVotesCard({ entry }: YourVotesCardProps) {
  const votedTimeAgo = formatDistanceToNow(new Date(entry.voted_at), { addSuffix: true });

  const getRankChangeIndicator = () => {
    if (!entry.rank_change || entry.rank_change === 'same') return null;

    if (entry.rank_change === 'up') {
      return (
        <div className="flex items-center gap-1 text-green-500">
          <ArrowUp className="h-3 w-3" />
          <span className="text-xs font-medium">Rising</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1 text-red-400">
        <ArrowDown className="h-3 w-3" />
        <span className="text-xs font-medium">Dropped</span>
      </div>
    );
  };

  return (
    <Card className="p-4 bg-card/50 border-primary/10 hover:border-primary/20 transition-colors">
      <div className="flex items-center gap-4">
        {/* Cover */}
        <div className="flex-shrink-0">
          {entry.cover_url ? (
            <img
              src={entry.cover_url}
              alt={entry.track_title}
              className="w-14 h-14 rounded-lg object-cover ring-2 ring-primary/20"
            />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
              <Music className="h-6 w-6 text-primary" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate text-foreground">
            {entry.track_title}
          </h3>
          <p className="text-sm text-muted-foreground truncate">
            {entry.artist_name}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Badge 
              variant="secondary" 
              className="text-xs bg-primary/10 text-primary border-primary/20 gap-1"
            >
              <Sparkles className="h-3 w-3" />
              You supported this ✨
            </Badge>
          </div>
        </div>

        {/* Vote count + rank + timestamp */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-primary">
            <Heart className="h-4 w-4 fill-current" />
            <AnimatePresence mode="wait">
              <motion.span
                key={entry.total_votes}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="text-sm font-bold"
              >
                {entry.total_votes}
              </motion.span>
            </AnimatePresence>
          </div>
          
          {/* Current rank badge */}
          {entry.current_rank && (
            <Badge variant="outline" className="text-xs px-1.5 py-0">
              #{entry.current_rank}
            </Badge>
          )}
          
          {/* Rank change indicator */}
          {getRankChangeIndicator()}
          
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {votedTimeAgo}
          </span>
        </div>
      </div>
    </Card>
  );
}
