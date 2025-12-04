import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Users, Zap, Clock } from 'lucide-react';
import { useCrowdPush } from '@/hooks/useCrowdPush';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface CrowdPushCardProps {
  artistId: string;
  artistName: string;
}

export function CrowdPushCard({ artistId, artistName }: CrowdPushCardProps) {
  const { user } = useAuth();
  const { crowdPush, hasJoined, progress, loading, startCrowdPush, joinCrowdPush } = useCrowdPush(artistId);

  if (loading) return null;

  const isCompleted = crowdPush?.status === 'completed';
  const expiresIn = crowdPush?.expires_at 
    ? formatDistanceToNow(new Date(crowdPush.expires_at), { addSuffix: true })
    : null;

  return (
    <Card className={`${isCompleted ? 'border-primary bg-primary/5' : 'border-border/50'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Crowd Push
          </CardTitle>
          {isCompleted && (
            <Badge className="bg-primary text-primary-foreground">
              <Zap className="h-3 w-3 mr-1" />
              ACTIVE
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {crowdPush ? (
          <>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {crowdPush.current_supporters} / {crowdPush.target_supporters} supporters
                </span>
                <span className="text-primary font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {expiresIn && !isCompleted && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Expires {expiresIn}
              </p>
            )}

            {isCompleted ? (
              <p className="text-sm text-primary">
                🚀 {artistName} is boosted for 24 hours!
              </p>
            ) : hasJoined ? (
              <p className="text-sm text-muted-foreground">
                You're part of this push! Share to rally more supporters.
              </p>
            ) : (
              <Button 
                onClick={joinCrowdPush} 
                className="w-full"
                disabled={!user}
              >
                Join Crowd Push
              </Button>
            )}
          </>
        ) : (
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground mb-3">
              Rally 100 supporters to give {artistName} a 24h discovery boost
            </p>
            <Button 
              onClick={startCrowdPush}
              variant="outline"
              className="w-full"
              disabled={!user}
            >
              <Users className="h-4 w-4 mr-2" />
              Start Crowd Push
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
