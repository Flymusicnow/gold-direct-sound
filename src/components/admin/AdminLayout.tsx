import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileAdminNav } from "./MobileAdminNav";

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
    if (!hasRole("admin")) {
      navigate("/");
    }
  }, [user, hasRole, navigate]);

  if (!user || !hasRole("admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {description && <p className="text-muted-foreground mt-1">{description}</p>}
        </div>
        <div className="px-4">{children}</div>
        <MobileAdminNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">{title}</h1>
            {description && <p className="text-muted-foreground mt-2">{description}</p>}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
