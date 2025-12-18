import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { FlyMusicLogo } from "@/components/FlyMusicLogo";
import {
  LayoutDashboard,
  Users,
  Star,
  KeyRound,
  Flag,
  Building2,
  Handshake,
  Activity,
  Shield,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Link2,
  Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const adminNavItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Inbox", url: "/admin/inbox", icon: Inbox, hasBadge: true },
  { title: "Approvals", url: "/admin/approvals", icon: Shield },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Artists", url: "/admin/artists", icon: Star },
  { title: "Tracks", url: "/admin/tracks", icon: Activity },
  { title: "Smart Links", url: "/admin/smart-links", icon: Link2 },
  { title: "Spotlight", url: "/admin/spotlight", icon: Star },
  { title: "Beta Codes", url: "/admin/beta-codes", icon: KeyRound },
  { title: "Feature Flags", url: "/admin/features", icon: Flag },
  { title: "Collab Entities", url: "/admin/collab-entities", icon: Building2 },
  { title: "Matching", url: "/admin/matching", icon: Handshake },
  { title: "Activity Log", url: "/admin/activity", icon: Activity },
  { title: "Brand Applications", url: "/admin/brand-applications", icon: Building2 },
  { title: "Campaigns", url: "/admin/campaigns", icon: Activity },
  { title: "Payouts", url: "/admin/payouts", icon: CreditCard },
  { title: "Roles", url: "/admin/roles", icon: Shield },
];

export function AdminSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [inboxCounts, setInboxCounts] = useState({ unread: 0, inProgress: 0 });

  useEffect(() => {
    const fetchInboxCounts = async () => {
      try {
        const { count: unread } = await supabase
          .from("inbox_messages")
          .select("*", { count: "exact", head: true })
          .eq("status", "unread");

        const { count: inProgress } = await supabase
          .from("inbox_messages")
          .select("*", { count: "exact", head: true })
          .eq("status", "in_progress");

        setInboxCounts({
          unread: unread || 0,
          inProgress: inProgress || 0,
        });
      } catch (error) {
        console.error("Error fetching inbox counts:", error);
      }
    };

    fetchInboxCounts();
    // Refresh every 30 seconds
    const interval = setInterval(fetchInboxCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalActive = inboxCounts.unread + inboxCounts.inProgress;
  const hasUnread = inboxCounts.unread > 0;

  return (
    <aside
      className={cn(
        "min-h-screen bg-card border-r border-border flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <FlyMusicLogo size="sm" />
            <span className="font-semibold text-primary">Admin</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {adminNavItems.map((item) => {
          const isActive = location.pathname === item.url || 
            (item.url !== "/admin" && location.pathname.startsWith(item.url));
          
          // Special handling for Inbox badge
          const showBadge = (item as { hasBadge?: boolean }).hasBadge && totalActive > 0;
          
          return (
            <RouterNavLink
              key={item.url}
              to={item.url}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                "hover:bg-muted/50",
                isActive && "bg-primary/10 text-primary border-l-2 border-primary",
                collapsed && "justify-center px-2"
              )}
            >
              <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary")} />
              {!collapsed && (
                <span className={cn("text-sm flex-1", isActive && "font-medium")}>{item.title}</span>
              )}
              {showBadge && !collapsed && (
                <span
                  className={cn(
                    "text-xs font-medium px-1.5 py-0.5 rounded-full",
                    hasUnread
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-yellow-500 text-yellow-50"
                  )}
                >
                  {totalActive}
                </span>
              )}
              {showBadge && collapsed && (
                <span
                  className={cn(
                    "absolute top-1 right-1 w-2 h-2 rounded-full",
                    hasUnread ? "bg-destructive" : "bg-yellow-500"
                  )}
                />
              )}
            </RouterNavLink>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground">FlyMusic Admin Panel</p>
        </div>
      )}
    </aside>
  );
}
