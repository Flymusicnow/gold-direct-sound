import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, User, Music, Calendar, BarChart3, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/studio" },
  { icon: User, label: "Profile", path: "/studio/profile" },
  { icon: Music, label: "Tracks", path: "/studio/tracks" },
  { icon: Calendar, label: "Events", path: "/studio/events" },
  { icon: BarChart3, label: "Analytics", path: "/studio/analytics" },
  { icon: MessageSquare, label: "Comments", path: "/studio/comments" },
];

export function StudioSidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 border-r border-border bg-card/50 min-h-screen p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-primary">My Studio</h2>
        <p className="text-sm text-muted-foreground">Creator Control Room</p>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
