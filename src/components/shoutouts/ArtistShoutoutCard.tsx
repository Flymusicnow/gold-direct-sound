import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ArtistShoutoutCardProps {
  artistName: string;
  artistAvatar?: string;
  message?: string;
  supporterNames: string[];
  shoutoutType: 'weekly_top' | 'milestone' | 'custom';
  createdAt: string;
}

export function ArtistShoutoutCard({
  artistName,
  artistAvatar,
  message,
  supporterNames,
  shoutoutType,
  createdAt,
}: ArtistShoutoutCardProps) {
  const typeLabels = {
    weekly_top: 'Top Supporters',
    milestone: 'Milestone',
    custom: 'Shoutout',
  };

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-primary/30">
            <AvatarImage src={artistAvatar} alt={artistName} />
            <AvatarFallback className="bg-primary/20 text-primary">
              {artistName.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-foreground">{artistName}</span>
              <Badge variant="outline" className="text-primary border-primary/30 text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                {typeLabels[shoutoutType]}
              </Badge>
            </div>

            {message && (
              <p className="text-sm text-muted-foreground mb-2">"{message}"</p>
            )}

            <div className="flex items-center gap-1 text-sm">
              <Heart className="h-4 w-4 text-primary fill-primary" />
              <span className="text-muted-foreground">
                {supporterNames.length > 3
                  ? `${supporterNames.slice(0, 3).join(', ')} +${supporterNames.length - 3} more`
                  : supporterNames.join(', ')}
              </span>
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
