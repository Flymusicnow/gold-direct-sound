import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Shield, Menu, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MobileAdminNav } from "@/components/admin/MobileAdminNav";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

const mainNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Mail, label: "Inbox", path: "/admin/inbox", showBadge: true },
  { icon: Shield, label: "Approvals", path: "/admin/approvals" },
];

export function BottomNavBarAdmin() {
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread count for inbox badge
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const { count } = await supabase
          .from("inbox_messages")
          .select("*", { count: "exact", head: true })
          .eq("status", "unread");
        setUnreadCount(count || 0);
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    fetchUnreadCount();

    // Subscribe to changes for real-time badge updates
    const channel = supabase
      .channel("inbox-badge")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inbox_messages" },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-background/95 backdrop-blur-sm pb-safe">
      <nav className="flex items-center justify-around h-14 px-2">
        {mainNavItems.map((item) => {
          const isActive = item.path === "/admin" 
            ? location.pathname === "/admin"
            : location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-lg transition-colors min-w-[64px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
                {item.showBadge && unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-3 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center"
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-0 w-12 h-0.5 bg-primary rounded-t-full" />
              )}
            </Link>
          );
        })}

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-lg transition-colors text-muted-foreground hover:text-foreground min-w-[64px]">
              <Menu className="h-5 w-5" />
              <span className="text-xs font-medium">More</span>
            </button>
          </SheetTrigger>
          <SheetContent 
            side="bottom" 
            className="h-[70vh] rounded-t-2xl"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <MobileAdminNav inSheet onNavigate={() => setSheetOpen(false)} />
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}
