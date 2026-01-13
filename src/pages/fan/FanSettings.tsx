import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings, User, Bell, Loader2, Volume2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { BottomNavBarFan } from "@/components/mobile/BottomNavBarFan";
import { useIsMobile } from "@/hooks/use-mobile";
import { LegalSettingsSection } from "@/components/legal/LegalSettingsSection";

export default function FanSettings() {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications();
  const { pauseMusicOnVideo, pipEnabled, updatePreference, loading: prefsLoading } = useUserPreferences();

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      await subscribe();
    } else {
      await unsubscribe();
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background pt-16 pb-28 md:pb-8">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Settings className="h-8 w-8 text-primary" />
              Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your account and preferences
            </p>
          </div>

          <div className="space-y-6">
            {/* Account Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">Email</label>
                  <p className="font-medium">{profile?.email || "—"}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Name</label>
                  <p className="font-medium">{profile?.full_name || "—"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Push Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push-notifications">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      {!isSupported 
                        ? "Push notifications are not supported in your browser"
                        : "Get notified about new releases from artists you follow"}
                    </p>
                  </div>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Switch
                      id="push-notifications"
                      checked={isSubscribed}
                      onCheckedChange={handlePushToggle}
                      disabled={!isSupported}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Playback Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-primary" />
                  Playback
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="pause-music-video">Pause music when playing video</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically pause music when you start watching a video
                    </p>
                  </div>
                  {prefsLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Switch
                      id="pause-music-video"
                      checked={pauseMusicOnVideo}
                      onCheckedChange={(checked) => updatePreference('pause_music_on_video', checked)}
                    />
                  )}
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="space-y-0.5">
                    <Label htmlFor="pip-enabled">Picture-in-Picture</Label>
                    <p className="text-sm text-muted-foreground">
                      Continue watching videos in a mini player while browsing
                    </p>
                  </div>
                  {prefsLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Switch
                      id="pip-enabled"
                      checked={pipEnabled}
                      onCheckedChange={(checked) => updatePreference('pip_enabled', checked)}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Legal Documents */}
            <LegalSettingsSection isArtist={false} />
          </div>
        </div>
      </div>
      {isMobile && <BottomNavBarFan />}
    </>
  );
}
