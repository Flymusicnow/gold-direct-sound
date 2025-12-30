import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Briefcase, Inbox, BarChart3, Settings, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { FlyMusicLogo } from "@/components/FlyMusicLogo";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/brand" },
  { icon: Building2, label: "Profile", path: "/brand/profile" },
  { icon: Users, label: "Discover Artists", path: "/brand/discovery" },
  { icon: Briefcase, label: "Opportunities", path: "/brand/opportunities" },
  { icon: Inbox, label: "Applications", path: "/brand/applications" },
  { icon: BarChart3, label: "Analytics", path: "/brand/analytics" },
  { icon: Settings, label: "Settings", path: "/brand/settings" },
];

export function BrandSidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 h-screen overflow-hidden bg-[hsl(0,0%,5%)] border-r border-border/50 flex flex-col shadow-elegant z-40 hidden md:flex">
      {/* Header - FIXED */}
      <div className="flex-shrink-0 p-6 pb-6 border-b border-border/30">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <FlyMusicLogo size="sm" />
            <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Brand Portal
            </h2>
          </div>
          <NotificationBell />
        </div>
        <p className="text-xs text-muted-foreground ml-10">Partner Dashboard</p>
      </div>

      {/* Menu - SCROLLABLE ONLY IF OVERFLOW */}
      <nav className="flex-1 min-h-0 overflow-y-auto p-6 pt-4 space-y-1 scrollbar-auto-hide">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 border-l-2",
                isActive
                  ? "border-primary bg-primary/10 text-primary font-semibold shadow-sm"
                  : "border-transparent text-muted-foreground hover:bg-muted/30 hover:text-foreground hover:border-muted"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
