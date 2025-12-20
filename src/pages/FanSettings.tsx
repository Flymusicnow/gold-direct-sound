import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MobileFanNav } from "@/components/fan/MobileFanNav";
import { BottomNavBarFan } from "@/components/mobile/BottomNavBarFan";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, CreditCard, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { LegalSettingsSection } from "@/components/legal/LegalSettingsSection";
import { BillingManagementCard } from "@/components/billing/BillingManagementCard";
import { useLanguage } from "@/contexts/LanguageContext";

export default function FanSettings() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
    if ((profile as any)?.avatar_url) {
      setAvatarUrl((profile as any).avatar_url);
    }
  }, [user, profile, navigate]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error("Please select a valid image (JPEG, PNG, or WebP)");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}_avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl } as any)
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      await refreshProfile();
      toast.success("Profile picture updated");
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error(error.message || "Failed to upload profile picture");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      toast.success("Settings updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <MobileFanNav />
      <div className="min-h-screen py-24 px-4 pb-20 md:pb-4">
        <div className="container mx-auto max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/fan')}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('fan.backToDashboard')}
        </Button>

        <h1 className="text-3xl font-bold mb-8">{t('settings.accountSettings')}</h1>

        <Card className="p-6 mb-6">
          {/* Profile Picture Upload */}
          <div className="flex items-center gap-6 mb-6 pb-6 border-b border-border">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl || undefined} alt="Profile" />
                <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                  {fullName?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1.5 hover:bg-primary/90 transition-colors"
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <div>
              <h3 className="font-semibold">{t('settings.profilePicture')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('settings.clickCameraToUpload')}
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <Label htmlFor="email">{t('settings.email')}</Label>
              <Input
                id="email"
                type="email"
                value={profile?.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t('settings.emailCannotBeChanged')}
              </p>
            </div>

            <div>
              <Label htmlFor="fullName">{t('settings.displayName')}</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('settings.yourName')}
                required
              />
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">{t('settings.notificationPreferences')}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('settings.notificationsComingSoon')}
              </p>
              <ul className="text-sm text-muted-foreground space-y-2 ml-4">
                <li>• {t('settings.newReleasesNotification')}</li>
                <li>• {t('settings.commentRepliesNotification')}</li>
                <li>• {t('settings.campaignsNotification')}</li>
              </ul>
            </div>

            <Button type="submit" disabled={loading} className="bg-gradient-gold">
              {loading ? t('common.saving') : t('common.saveChanges')}
            </Button>
          </form>
        </Card>

        {/* Subscription & Billing Section */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            {t('settings.subscriptionBilling')}
          </h3>
          <BillingManagementCard userType="fan" />
        </Card>

        {/* Legal Documents Section */}
        <div className="mt-8">
          <LegalSettingsSection isArtist={false} isBrand={false} />
        </div>
        </div>
      </div>
      {isMobile && <BottomNavBarFan />}
    </>
  );
}
