import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFanProfile } from "@/hooks/useFanProfile";
import { MobileFanNav } from "@/components/fan/MobileFanNav";
import { FanSidebar } from "@/components/fan/FanSidebar";
import { PageBreadcrumb } from "@/components/navigation/PageBreadcrumb";
import { BottomNavBarFan } from "@/components/mobile/BottomNavBarFan";
import { useIsMobile } from "@/hooks/use-mobile";
import { AvatarUploadProgress } from "@/components/ui/avatar-upload-progress";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CreditCard, UserCircle, Music } from "lucide-react";
import { toast } from "sonner";
import { LegalSettingsSection } from "@/components/legal/LegalSettingsSection";
import { BillingManagementCard } from "@/components/billing/BillingManagementCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";

export default function FanSettings() {
  const { user, profile: authProfile } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isMobile = useIsMobile();

  // Use unified fan profile hook
  const {
    profile,
    saving,
    avatarUploader,
    updateProfile,
  } = useFanProfile();

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (authProfile?.full_name) {
      setFullName(authProfile.full_name);
    }
    if ((authProfile as any)?.bio) {
      setBio((authProfile as any).bio);
    }
  }, [user, authProfile, navigate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await updateProfile({ fullName, bio });
    
    if (result.success) {
      toast.success(t('toast.saved'));
    } else {
      toast.error(result.error || t('toast.failed'));
    }
  };

  return (
    <>
      <MobileFanNav />
      <div className="flex min-h-screen w-full pt-16">
        <FanSidebar />
        <main className="flex-1 p-4 md:p-6 pb-28 md:pb-8">
          <PageBreadcrumb role="fan" />
          
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">{t('settings.accountSettings')}</h1>

            {/* Account Type Section */}
            <Card className="p-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserCircle className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{t('settings.accountType')}</h3>
                  <p className="text-sm text-muted-foreground">{t('settings.accountTypeDescription')}</p>
                </div>
                <Badge variant="secondary" className="capitalize">
                  Fan
                </Badge>
              </div>
            </Card>

            <Card className="p-6 mb-6">
              {/* Profile Picture Upload with Progress */}
              <div className="flex items-center gap-6 mb-6 pb-6 border-b border-border">
                <AvatarUploadProgress
                  currentUrl={(authProfile as any)?.avatar_url}
                  fallback={fullName?.[0]?.toUpperCase() || authProfile?.email?.[0]?.toUpperCase() || "U"}
                  size="md"
                  uploading={avatarUploader.uploading}
                  progress={avatarUploader.progress}
                  onFileSelect={avatarUploader.handleFileSelect}
                />
                <div>
                  <h3 className="font-semibold">{t('settings.profilePicture')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {avatarUploader.uploading 
                      ? `Uploading... ${avatarUploader.progress}%`
                      : t('settings.clickCameraToUpload')
                    }
                  </p>
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                <div>
                  <Label htmlFor="email">{t('settings.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={authProfile?.email || ""}
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

                {/* Music Bio Section */}
                <div>
                  <Label htmlFor="bio" className="flex items-center gap-2">
                    <Music className="h-4 w-4 text-primary" />
                    {t('fan.musicBio')}
                  </Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    {t('fan.musicBioDescription')}
                  </p>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, 300))}
                    placeholder={t('fan.musicBioPlaceholder')}
                    className="min-h-[100px] resize-none"
                    maxLength={300}
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {bio.length}/300
                  </p>
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

                <Button type="submit" disabled={saving} className="bg-gradient-gold">
                  {saving ? t('common.saving') : t('settings.saveChanges')}
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
        </main>
      </div>
      {isMobile && <BottomNavBarFan />}
    </>
  );
}
