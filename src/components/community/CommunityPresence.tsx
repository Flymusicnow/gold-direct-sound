import { Users, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCommunityPresence, PresenceUser } from '@/hooks/useCommunityPresence';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface CommunityPresenceProps {
  communityId: string | null;
  artistUserId?: string | null;
  className?: string;
}

function PresenceAvatar({ user, size = 'sm' }: { user: PresenceUser; size?: 'sm' | 'md' }) {
  const initials = user.displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative">
      <Avatar className={cn(size === 'sm' ? 'h-7 w-7' : 'h-9 w-9')}>
        <AvatarImage src={user.avatarUrl || undefined} alt={user.displayName} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 ring-2 ring-background" />
    </div>
  );
}

function OnlineUserRow({ user }: { user: PresenceUser }) {
  const initials = user.displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="relative">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.avatarUrl || undefined} alt={user.displayName} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 ring-2 ring-background" />
      </div>
      <span className="text-sm font-medium flex-1 truncate">{user.displayName}</span>
      {user.isArtist && (
        <Badge variant="secondary" className="gap-1 text-xs">
          <Sparkles className="h-3 w-3" />
          Artist
        </Badge>
      )}
    </div>
  );
}

export function CommunityPresence({ communityId, artistUserId, className }: CommunityPresenceProps) {
  const { t } = useLanguage();
  const { onlineUsers, totalOnline, isConnected, artistOnline } = useCommunityPresence(
    communityId,
    artistUserId
  );

  if (!communityId || !isConnected) return null;

  const displayUsers = onlineUsers.slice(0, 5);
  const remainingCount = Math.max(0, totalOnline - 5);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors',
            className
          )}
        >
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium">{totalOnline}</span>
          </div>
          
          <span className="text-sm text-muted-foreground">{t('community.onlineNow')}</span>
          
          {artistOnline && (
            <Badge variant="secondary" className="gap-1 text-xs ml-1">
              <Sparkles className="h-3 w-3" />
              {t('community.artistOnline')}
            </Badge>
          )}
          
          {totalOnline > 0 && (
            <div className="flex -space-x-2 ml-2">
              {displayUsers.map((user) => (
                <PresenceAvatar key={user.id} user={user} />
              ))}
              {remainingCount > 0 && (
                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium ring-2 ring-background">
                  +{remainingCount}
                </div>
              )}
            </div>
          )}
        </button>
      </PopoverTrigger>
      
      <PopoverContent align="start" className="w-64 p-3">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {totalOnline} {t('community.membersOnline')}
          </span>
        </div>
        
        <ScrollArea className="max-h-64">
          <div className="space-y-1">
            {onlineUsers.map((user) => (
              <OnlineUserRow key={user.id} user={user} />
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
