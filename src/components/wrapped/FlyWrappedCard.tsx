import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Share2, Trophy, Music, Users, Star, Play } from 'lucide-react';

interface FlyWrappedCardProps {
  month: number;
  year: number;
  topArtists: Array<{ name: string; plays: number }>;
  topTracks: Array<{ title: string; artist: string }>;
  totalXpEarned: number;
  artistsDiscovered: number;
  spotlightVotes: number;
  totalPlays: number;
  onShare?: () => void;
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function FlyWrappedCard({
  month,
  year,
  topArtists,
  topTracks,
  totalXpEarned,
  artistsDiscovered,
  spotlightVotes,
  totalPlays,
  onShare,
}: FlyWrappedCardProps) {
  return (
    <Card className="bg-gradient-to-br from-background via-primary/5 to-primary/10 border-primary/20 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            FlyWrapped
          </CardTitle>
          <Badge className="bg-primary text-primary-foreground">
            {monthNames[month - 1]} {year}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatBox icon={<Play className="h-4 w-4" />} label="Plays" value={totalPlays} />
          <StatBox icon={<Star className="h-4 w-4" />} label="XP Earned" value={totalXpEarned} />
          <StatBox icon={<Users className="h-4 w-4" />} label="Artists Discovered" value={artistsDiscovered} />
          <StatBox icon={<Trophy className="h-4 w-4" />} label="Spotlight Votes" value={spotlightVotes} />
        </div>

        {/* Top Artists */}
        {topArtists.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <Music className="h-4 w-4 text-primary" />
              Top Artists
            </h4>
            <div className="space-y-1">
              {topArtists.slice(0, 3).map((artist, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="text-primary font-medium">#{i + 1}</span>
                    {artist.name}
                  </span>
                  <span className="text-muted-foreground">{artist.plays} plays</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Share Button */}
        {onShare && (
          <Button onClick={onShare} variant="outline" className="w-full gap-2">
            <Share2 className="h-4 w-4" />
            Share Your Wrapped
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-background/50 rounded-lg p-3 text-center">
      <div className="flex items-center justify-center gap-1.5 text-primary mb-1">
        {icon}
      </div>
      <div className="text-lg font-bold text-foreground">{value.toLocaleString()}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
