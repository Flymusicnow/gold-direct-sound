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
  FlaskConical,
  Link2,
  Inbox,
  Briefcase,
  CheckCircle,
  Bell,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const navSections = [
  {
    title: "Overview",
    items: [
      { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
      { title: "Inbox", url: "/admin/inbox", icon: Inbox, hasBadge: true },
      { title: "QA Mode", url: "/admin/qa", icon: FlaskConical },
    ]
  },
  {
    title: "Content",
    items: [
      { title: "Approvals", url: "/admin/approvals", icon: Shield },
      { title: "Verifications", url: "/admin/verifications", icon: CheckCircle },
      { title: "Users", url: "/admin/users", icon: Users },
      { title: "Artists", url: "/admin/artists", icon: Star },
      { title: "Tracks", url: "/admin/tracks", icon: Activity },
      { title: "Smart Links", url: "/admin/smart-links", icon: Link2 },
      { title: "Spotlight", url: "/admin/spotlight", icon: Star },
      { title: "Updates", url: "/admin/updates", icon: Bell },
    ]
  },
  {
    title: "Partnerships",
    items: [
      { title: "Collab Entities", url: "/admin/collab-entities", icon: Building2 },
      { title: "Opportunities", url: "/admin/opportunities", icon: Briefcase },
      { title: "Matching", url: "/admin/matching", icon: Handshake },
      { title: "Brand Applications", url: "/admin/brand-applications", icon: Building2 },
      { title: "Campaigns", url: "/admin/campaigns", icon: Activity },
    ]
  },
  {
    title: "System",
    items: [
      { title: "Beta Codes", url: "/admin/beta-codes", icon: KeyRound },
      { title: "Feature Flags", url: "/admin/features", icon: Flag },
      { title: "Activity Log", url: "/admin/activity", icon: Activity },
      { title: "Payouts", url: "/admin/payouts", icon: CreditCard },
      { title: "Roles", url: "/admin/roles", icon: Shield },
    ]
  }
];

export function AdminSidebar() {
  const location = useLocation();
  const { signOut } = useAuth();
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
      <nav className="flex-1 p-2 overflow-y-auto">
        {navSections.map((section, sectionIndex) => (
          <div key={section.title}>
            {/* Section divider (except first section) */}
            {sectionIndex > 0 && !collapsed && (
              <div className="my-3 border-t border-border/30" />
            )}
            
            {/* Section header */}
            {!collapsed && (
              <p className="px-3 py-2 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
                {section.title}
              </p>
            )}
            
            {/* Collapsed divider */}
            {sectionIndex > 0 && collapsed && (
              <div className="my-2 mx-2 border-t border-border/30" />
            )}
            
            {/* Section items */}
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = location.pathname === item.url || 
                  (item.url !== "/admin" && location.pathname.startsWith(item.url));
                
                const showBadge = (item as { hasBadge?: boolean }).hasBadge && totalActive > 0;
                
                return (
                  <RouterNavLink
                    key={item.url}
                    to={item.url}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative",
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
            </div>
          </div>
        ))}
      </nav>

      {/* Footer with Logout */}
      <div className="p-4 border-t border-border space-y-3">
        <Button
          variant="ghost"
          onClick={signOut}
          className={cn(
            "w-full justify-start gap-3 text-muted-foreground hover:text-foreground hover:bg-destructive/10",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
        {!collapsed && (
          <p className="text-xs text-muted-foreground">FlyMusic Admin Panel</p>
        )}
      </div>
    </aside>
  );
}
