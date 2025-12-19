import { StudioSidebar } from "@/components/artist/StudioSidebar";
import { BottomNavBarStudio } from "@/components/mobile/BottomNavBarStudio";
import { useIsMobile } from "@/hooks/use-mobile";
import { LegalSettingsSection } from "@/components/legal/LegalSettingsSection";
import { BillingManagementCard } from "@/components/billing/BillingManagementCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings, User, CreditCard, Bell, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export default function StudioSettings() {
  const isMobile = useIsMobile();
  const { profile } = useAuth();
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications();

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      await subscribe();
    } else {
      await unsubscribe();
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <StudioSidebar />
      
      <main className="flex-1 p-6 pb-24 md:pb-6">
        <div className="max-w-3xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Settings className="h-8 w-8 text-primary" />
              Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your account and preferences
            </p>
          </div>

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
              <div>
                <label className="text-sm text-muted-foreground">Role</label>
                <p className="font-medium capitalize">{profile?.role || "—"}</p>
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
                      : "Get notified about new followers, comments, and important updates"}
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

          {/* Billing & Subscription */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Billing & Subscription
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