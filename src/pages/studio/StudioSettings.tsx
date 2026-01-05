import { StudioSidebar } from "@/components/artist/StudioSidebar";
import { BottomNavBarStudio } from "@/components/mobile/BottomNavBarStudio";
import { useIsMobile } from "@/hooks/use-mobile";
import { LegalSettingsSection } from "@/components/legal/LegalSettingsSection";
import { BillingManagementCard } from "@/components/billing/BillingManagementCard";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings, User, CreditCard, Bell, Loader2, Pencil, Check, X, Globe, Mail, Music, Video, Volume2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function StudioSettings() {
  const isMobile = useIsMobile();
  const { profile, user, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications();
  const { pauseMusicOnVideo, pipEnabled, updatePreference, loading: prefsLoading } = useUserPreferences();

  // Name editing state
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(profile?.full_name || '');
  const [savingName, setSavingName] = useState(false);

  // Email editing state
  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  // Changelog subscription state
  const [changelogSubscribed, setChangelogSubscribed] = useState(false);
  const [loadingChangelog, setLoadingChangelog] = useState(true);

  // Video autoplay state (artist-specific)
  const [videoAutoplayEnabled, setVideoAutoplayEnabled] = useState(true);
  const [loadingAutoplay, setLoadingAutoplay] = useState(true);

  // Sync name when profile loads
  useEffect(() => {
    if (profile?.full_name) {
      setNewName(profile.full_name);
    }
  }, [profile?.full_name]);

  // Load changelog subscription status
  useEffect(() => {
    const loadChangelogSubscription = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('changelog_subscriptions')
        .select('is_active')
        .eq('user_id', user.id)
        .maybeSingle();
      
      setChangelogSubscribed(data?.is_active ?? false);
      setLoadingChangelog(false);
    };

    loadChangelogSubscription();
  }, [user]);

  // Load video autoplay setting from artist_profiles
  useEffect(() => {
    const loadVideoAutoplay = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('artist_profiles')
        .select('video_autoplay_enabled')
        .eq('user_id', user.id)
        .maybeSingle();
      
      setVideoAutoplayEnabled(data?.video_autoplay_enabled ?? true);
      setLoadingAutoplay(false);
    };

    loadVideoAutoplay();
  }, [user]);

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      await subscribe();
    } else {
      await unsubscribe();
    }
  };

  const handleSaveName = async () => {
    if (!user || !newName.trim()) return;
    
    setSavingName(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: newName.trim() })
      .eq('id', user.id);

    if (error) {
      toast.error('Failed to update name');
    } else {
      toast.success(t('settings.nameUpdated'));
      await refreshProfile();
      setEditingName(false);
    }
    setSavingName(false);
  };

  const handleSaveEmail = async () => {
    if (!newEmail.trim()) return;
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });

    if (error) {
      toast.error(error.message || 'Failed to update email');
    } else {
      toast.success(t('settings.emailUpdateRequested'));
      setEditingEmail(false);
      setNewEmail('');
    }
    setSavingEmail(false);
  };

  const handleChangelogToggle = async (enabled: boolean) => {
    if (!user || !profile?.email) return;
    
    setLoadingChangelog(true);
    
    if (enabled) {
      // Subscribe
      const { error } = await supabase
        .from('changelog_subscriptions')
        .upsert({
          user_id: user.id,
          email: profile.email,
          is_active: true,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        toast.error('Failed to subscribe');
      } else {
        setChangelogSubscribed(true);
        toast.success('Subscribed to changelog updates');
      }
    } else {
      // Unsubscribe
      const { error } = await supabase
        .from('changelog_subscriptions')
        .update({ is_active: false })
        .eq('user_id', user.id);

      if (error) {
        toast.error('Failed to unsubscribe');
      } else {
        setChangelogSubscribed(false);
        toast.success('Unsubscribed from changelog updates');
      }
    }
    
    setLoadingChangelog(false);
  };

  const handleVideoAutoplayToggle = async (enabled: boolean) => {
    if (!user) return;
    
    setLoadingAutoplay(true);
    setVideoAutoplayEnabled(enabled);
    
    const { error } = await supabase
      .from('artist_profiles')
      .update({ video_autoplay_enabled: enabled })
      .eq('user_id', user.id);
    
    if (error) {
      toast.error('Failed to update video autoplay setting');
      setVideoAutoplayEnabled(!enabled); // Revert on error
    } else {
      toast.success(enabled ? 'Video autoplay enabled' : 'Video autoplay disabled');
    }
    
    setLoadingAutoplay(false);
  };

  return (
    <div className="h-screen overflow-hidden flex bg-background pt-16">
      <StudioSidebar />
      
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-auto-hide p-6 pb-24 md:pb-6">
        <div className="max-w-3xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Settings className="h-8 w-8 text-primary" />
              {t('settings.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('settings.subtitle')}
            </p>
          </div>

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                {t('settings.account')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email with edit */}
              <div>
                <label className="text-sm text-muted-foreground">{t('common.email')}</label>
                {editingEmail ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder={profile?.email || 'New email address'}
                      className="flex-1"
                    />
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={handleSaveEmail}
                      disabled={savingEmail || !newEmail.trim()}
                    >
                      {savingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => { setEditingEmail(false); setNewEmail(''); }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mt-1">
                    <p className="font-medium">{profile?.email || "—"}</p>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setEditingEmail(true)}
                      className="h-8"
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      {t('common.edit')}
                    </Button>
                  </div>
                )}
                {editingEmail && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {t('settings.emailVerificationSent')}
                  </p>
                )}
              </div>

              {/* Name with edit */}
              <div>
                <label className="text-sm text-muted-foreground">{t('common.name')}</label>
                {editingName ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Your name"
                      className="flex-1"
                    />
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={handleSaveName}
                      disabled={savingName || !newName.trim()}
                    >
                      {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => { setEditingName(false); setNewName(profile?.full_name || ''); }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mt-1">
                    <p className="font-medium">{profile?.full_name || "—"}</p>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setEditingName(true)}
                      className="h-8"
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      {t('common.edit')}
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Music className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">{t('settings.accountType')}</label>
                    <p className="font-medium">{t('settings.accountTypeDescription')}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="capitalize">
                  Artist
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Language Preference */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                {t('settings.language')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LanguageSwitcher showLabel={false} />
            </CardContent>
          </Card>

          {/* Push Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                {t('settings.notifications')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-notifications">{t('settings.pushNotifications')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {!isSupported 
                      ? t('settings.pushNotificationsNotSupported')
                      : t('settings.pushNotificationsDescription')}
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

              {/* Changelog email subscription */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="space-y-0.5">
                  <Label htmlFor="changelog-updates">{t('settings.changelogUpdates')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.changelogUpdatesDescription')}
                  </p>
                </div>
                {loadingChangelog ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Switch
                    id="changelog-updates"
                    checked={changelogSubscribed}
                    onCheckedChange={handleChangelogToggle}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Video Preferences (Artist-specific) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                Video Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="video-autoplay">Autoplay Profile Videos</Label>
                  <p className="text-sm text-muted-foreground">
                    Videos will automatically play when fans scroll to them on your profile
                  </p>
                </div>
                {loadingAutoplay ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Switch
                    id="video-autoplay"
                    checked={videoAutoplayEnabled}
                    onCheckedChange={handleVideoAutoplayToggle}
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

          {/* Billing & Subscription */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                {t('settings.billing')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BillingManagementCard userType="artist" />
            </CardContent>
          </Card>

          {/* Legal Documents Section */}
          <LegalSettingsSection isArtist={true} />
        </div>
      </main>

      {isMobile && <BottomNavBarStudio />}
    </div>
  );
}
