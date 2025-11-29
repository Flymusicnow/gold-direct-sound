import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface ArtistSpotlightCardProps {
  campaignId: string;
  campaignName: string;
  votes: number;
  rank?: number;
}

export function ArtistSpotlightCard({
  campaignId,
  campaignName,
  votes,
  rank,
}: ArtistSpotlightCardProps) {
  return (
    <div className="ticket-gold rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Sparkles className="w-6 h-6 text-primary" />
        <div className="flex-1">
          <h3 className="font-semibold text-lg">In FlyMusic Spotlight</h3>
          <p className="text-sm text-muted-foreground">{campaignName}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        {rank && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rank</span>
            <Badge className="bg-primary/20 text-primary border-primary/50 text-lg px-3">
              #{rank}
            </Badge>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Votes</span>
          <span className="text-2xl font-bold text-primary">{votes.toLocaleString()}</span>
        </div>
      </div>

      <Link to={`/spotlight/${campaignId}`}>
        <Button className="w-full btn-gold-premium rounded-full">
          Support in Spotlight
        </Button>
      </Link>
    </div>
  );
}
