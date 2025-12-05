import { StudioSidebar } from "@/components/artist/StudioSidebar";
import { BottomNavBarStudio } from "@/components/mobile/BottomNavBarStudio";
import { useIsMobile } from "@/hooks/use-mobile";
import { LegalSettingsSection } from "@/components/legal/LegalSettingsSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function StudioSettings() {
  const isMobile = useIsMobile();
  const { profile } = useAuth();

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

          {/* Legal Documents Section */}
          <LegalSettingsSection isArtist={true} />
        </div>
      </main>

      {isMobile && <BottomNavBarStudio />}
    </div>
  );
}