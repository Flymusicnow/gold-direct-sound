import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useCommunityNotificationPrefs } from '@/hooks/useCommunityNotificationPrefs';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface NotificationPrefsDialogProps {
  communityId: string | null;
  className?: string;
  variant?: 'default' | 'icon';
}

export function NotificationPrefsDialog({ 
  communityId, 
  className,
  variant = 'default' 
}: NotificationPrefsDialogProps) {
  const { t } = useLanguage();
  const { prefs, updatePrefs, isLoading, isSaving, isSubscribed } = useCommunityNotificationPrefs(communityId);

  if (!communityId) return null;

  const trigger = variant === 'icon' ? (
    <Button 
      variant="ghost" 
      size="icon" 
      className={cn('relative', className)}
      disabled={isLoading}
    >
      {isSubscribed ? (
        <Bell className="h-5 w-5" />
      ) : (
        <BellOff className="h-5 w-5 text-muted-foreground" />
      )}
    </Button>
  ) : (
    <Button 
      variant={isSubscribed ? 'secondary' : 'outline'} 
      size="sm"
      className={cn('gap-2', className)}
      disabled={isLoading}
    >
      {isSubscribed ? (
        <>
          <Bell className="h-4 w-4" />
          {t('community.notificationsOn')}
        </>
      ) : (
        <>
          <BellOff className="h-4 w-4" />
          {t('community.notificationsOff')}
        </>
      )}
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            {t('community.notificationPrefs')}
          </DialogTitle>
          <DialogDescription>
            {t('community.notificationPrefsDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="notify-artist-posts" className="flex flex-col gap-1">
                <span>{t('community.notifyArtistPosts')}</span>
                <span className="text-xs text-muted-foreground font-normal">
                  {t('community.notifyArtistPostsDesc')}
                </span>
              </Label>
              <Switch
                id="notify-artist-posts"
                checked={prefs.notifyArtistPosts}
                onCheckedChange={(checked) => updatePrefs({ notifyArtistPosts: checked })}
                disabled={isSaving}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="notify-pinned" className="flex flex-col gap-1">
                <span>{t('community.notifyPinnedPosts')}</span>
                <span className="text-xs text-muted-foreground font-normal">
                  {t('community.notifyPinnedPostsDesc')}
                </span>
              </Label>
              <Switch
                id="notify-pinned"
                checked={prefs.notifyPinnedPosts}
                onCheckedChange={(checked) => updatePrefs({ notifyPinnedPosts: checked })}
                disabled={isSaving}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Label htmlFor="notify-mentions" className="flex flex-col gap-1">
                <span>{t('community.notifyMentions')}</span>
                <span className="text-xs text-muted-foreground font-normal">
                  {t('community.notifyMentionsDesc')}
                </span>
              </Label>
              <Switch
                id="notify-mentions"
                checked={prefs.notifyMentions}
                onCheckedChange={(checked) => updatePrefs({ notifyMentions: checked })}
                disabled={isSaving}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="notify-replies" className="flex flex-col gap-1">
                <span>{t('community.notifyReplies')}</span>
                <span className="text-xs text-muted-foreground font-normal">
                  {t('community.notifyRepliesDesc')}
                </span>
              </Label>
              <Switch
                id="notify-replies"
                checked={prefs.notifyReplies}
                onCheckedChange={(checked) => updatePrefs({ notifyReplies: checked })}
                disabled={isSaving}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Label htmlFor="push-enabled" className="flex flex-col gap-1">
                <span>{t('community.pushNotifications')}</span>
                <span className="text-xs text-muted-foreground font-normal">
                  {t('community.pushNotificationsDesc')}
                </span>
              </Label>
              <Switch
                id="push-enabled"
                checked={prefs.pushEnabled}
                onCheckedChange={(checked) => updatePrefs({ pushEnabled: checked })}
                disabled={isSaving}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
