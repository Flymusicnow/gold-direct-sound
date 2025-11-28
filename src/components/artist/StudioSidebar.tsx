import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, User, Music, Calendar, BarChart3, MessageSquare, Sparkles, Video, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { FlyMusicLogo } from "@/components/FlyMusicLogo";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/studio" },
  { icon: User, label: "Profile", path: "/studio/profile" },
  { icon: Music, label: "Tracks", path: "/studio/tracks" },
  { icon: Video, label: "Videos", path: "/studio/videos" },
  { icon: FolderOpen, label: "Video Collections", path: "/studio/video-collections" },
  { icon: Calendar, label: "Events", path: "/studio/events" },
  { icon: Sparkles, label: "Spotlight", path: "/studio/spotlight" },
  { icon: BarChart3, label: "Analytics", path: "/studio/analytics" },
  { icon: MessageSquare, label: "Comments", path: "/studio/comments" },
];

export function StudioSidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 sticky top-16 h-[calc(100vh-64px)] bg-[hsl(0,0%,5%)] border-r border-border/50 p-6 overflow-y-auto shadow-elegant z-40 hidden md:block">
      <div className="mb-8 pb-6 border-b border-border/30">
          <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <FlyMusicLogo size="sm" />
            <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              My Studio
            </h2>
          </div>
          <NotificationBell />
        </div>
        <p className="text-xs text-muted-foreground ml-10">Creator Control Room</p>
      </div>

      <nav className="space-y-1">
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
