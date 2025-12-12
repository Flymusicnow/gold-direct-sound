import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileAdminNav } from "./MobileAdminNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, ChevronRight } from "lucide-react";
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
        {/* Admin Mode Header with safe-area support */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border pt-safe">
          <div className="px-4 py-4 flex flex-col gap-2">
            {/* Top row: Back button + Admin badge */}
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate("/admin")} 
                className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Dashboard</span>
              </Button>
              <Badge className="bg-primary/10 text-primary border-primary/20 gap-1">
                <Shield className="h-3 w-3" />
                ADMIN
              </Badge>
            </div>
            {/* Breadcrumbs */}
            <div className="flex items-center gap-1.5 text-sm">
              <span 
                className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors" 
                onClick={() => navigate("/admin")}
              >
                Admin
              </span>
              {showBackButton && (
                <>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  <span className="text-foreground font-medium truncate">{title}</span>
                </>
              )}
            </div>
            {/* Page title and description */}
            <div className="mt-1">
              <h1 className="text-xl font-bold text-foreground">{title}</h1>
              {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
            </div>
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
          <div className="p-6 flex flex-col gap-3">
            {/* Top row: Navigation + Admin badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {showBackButton && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate("/admin")} 
                    className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Button>
                )}
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-sm">
                  <span 
                    className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors" 
                    onClick={() => navigate("/admin")}
                  >
                    Admin
                  </span>
                  {showBackButton && (
                    <>
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      <span className="text-foreground font-medium">{title}</span>
                    </>
                  )}
                </div>
              </div>
              <Badge className="bg-primary/10 text-primary border-primary/20 gap-1 text-sm">
                <Shield className="h-4 w-4" />
                ADMIN MODE
              </Badge>
            </div>
            {/* Page title and description */}
            <div>
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
              {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
            </div>
          </div>
        </div>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
