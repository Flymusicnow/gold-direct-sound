import { useState, useEffect } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Clock, Music, Video, Bell, BellOff, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useScheduledReleases } from "@/hooks/useScheduledReleases";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface ComingSoonCardProps {
  id: string;
  type: 'track' | 'video';
  title: string;
  coverUrl?: string;
  releaseDate: string;
  artistId: string;
  artistName: string;
}

export function ComingSoonCard({
  id,
  type,
  title,
  coverUrl,
  releaseDate,
  artistId,
  artistName
}: ComingSoonCardProps) {
  const { user } = useAuth();
  const { subscribeToRelease, unsubscribeFromRelease, isSubscribed: checkSubscribed } = useScheduledReleases(artistId);
  const [isNotifying, setIsNotifying] = useState(false);
  const [loading, setLoading] = useState(false);

  const date = new Date(releaseDate);
  const timeUntil = formatDistanceToNow(date, { addSuffix: true });

  useEffect(() => {
    const checkStatus = async () => {
      const subscribed = await checkSubscribed(id, type);
      setIsNotifying(subscribed);
    };
    if (user) {
      checkStatus();
    }
  }, [id, type, user, checkSubscribed]);

  const handleNotifyToggle = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      if (isNotifying) {
        await unsubscribeFromRelease(id, type);
        setIsNotifying(false);
      } else {
        await subscribeToRelease(id, type);
        setIsNotifying(true);
      }
    } catch (error) {
      console.error('Failed to toggle notification:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative group overflow-hidden rounded-lg border bg-card">
      {/* Cover Image with Blur Overlay */}
      <div className="relative aspect-square bg-muted">
        {coverUrl ? (
          <>
            <img
              src={coverUrl}
              alt={title}
              className="h-full w-full object-cover filter blur-sm opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-background/30" />
          </>
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-muted">
            {type === 'track' ? (
              <Music className="h-12 w-12 text-muted-foreground/50" />
            ) : (
              <Video className="h-12 w-12 text-muted-foreground/50" />
            )}
          </div>
        )}

        {/* Lock Icon Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-background/80 backdrop-blur-sm rounded-full p-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
        </div>

        {/* Coming Soon Badge */}
        <Badge 
          variant="secondary" 
          className="absolute top-2 left-2 bg-primary/90 text-primary-foreground"
        >
          Coming Soon
        </Badge>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="font-medium text-sm truncate">{title}</h4>
            <p className="text-xs text-muted-foreground truncate">{artistName}</p>
          </div>
          <Badge variant="outline" className="text-xs flex-shrink-0">
            {type === 'track' ? 'Song' : 'Video'}
          </Badge>
        </div>

        {/* Countdown */}
        <div className="flex items-center gap-1.5 text-xs">
          <Clock className="h-3 w-3 text-primary" />
          <span className="text-muted-foreground">Releases {timeUntil}</span>
        </div>
        
        <p className="text-xs text-muted-foreground">
          {format(date, 'PPP')} at {format(date, 'p')}
        </p>

        {/* Get Notified Button */}
        {user && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isNotifying ? "secondary" : "outline"}
                  size="sm"
                  className={cn(
                    "w-full mt-2",
                    isNotifying && "bg-primary/10 text-primary border-primary/30"
                  )}
                  onClick={handleNotifyToggle}
                  disabled={loading}
                >
                  {isNotifying ? (
                    <>
                      <BellOff className="h-3.5 w-3.5 mr-1.5" />
                      Notifications On
                    </>
                  ) : (
                    <>
                      <Bell className="h-3.5 w-3.5 mr-1.5" />
                      Get Notified
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isNotifying 
                  ? "Click to turn off notifications for this release" 
                  : "Get notified when this releases"
                }
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Disabled Play Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full opacity-50 cursor-not-allowed"
                disabled
              >
                <Lock className="h-3.5 w-3.5 mr-1.5" />
                Available {format(date, 'MMM d')}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              This content will be available on {format(date, 'PPP')}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
