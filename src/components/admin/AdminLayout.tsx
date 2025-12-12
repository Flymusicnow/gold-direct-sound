import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileAdminNav } from "./MobileAdminNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";
import { BottomNavBarAdmin } from "@/components/mobile/BottomNavBarAdmin";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const { user, profile, hasRole } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!hasRole("admin") && !hasRole("super_admin")) {
      navigate("/");
    }
  }, [user, hasRole, navigate]);

  if (!user || (!hasRole("admin") && !hasRole("super_admin"))) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const showBackButton = title !== "Admin Dashboard";

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-20">
        {/* Admin Mode Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {showBackButton && (
                <Button variant="ghost" size="icon" onClick={() => navigate("/admin")} className="h-8 w-8">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div>
                <h1 className="text-lg font-bold text-foreground">{title}</h1>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
              </div>
            </div>
            <Badge className="bg-primary/10 text-primary border-primary/20 gap-1">
              <Shield className="h-3 w-3" />
              ADMIN
            </Badge>
          </div>
        </div>
        <div className="px-4 py-4">{children}</div>
        <BottomNavBarAdmin />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        {/* Admin Mode Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {showBackButton && (
                <Button variant="ghost" size="icon" onClick={() => navigate("/admin")} className="h-8 w-8">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-foreground">{title}</h1>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
              </div>
            </div>
            <Badge className="bg-primary/10 text-primary border-primary/20 gap-1 text-sm">
              <Shield className="h-4 w-4" />
              ADMIN MODE
            </Badge>
          </div>
        </div>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
