import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Briefcase, Inbox, Menu, BarChart3, Settings, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useBrandPendingCount } from "@/hooks/useBrandPendingCount";
import { useBrandMessages } from "@/hooks/useBrandMessages";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";

const mainNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/brand" },
  { icon: Users, label: "Artists", path: "/brand/discovery" },
  { icon: Briefcase, label: "Jobs", path: "/brand/opportunities" },
  { icon: Inbox, label: "Apps", path: "/brand/applications", badgeType: "pending" as const },
  { icon: MessageSquare, label: "Msgs", path: "/brand/inbox", badgeType: "messages" as const },
];

const moreNavItems = [
  { icon: BarChart3, label: "Analytics", path: "/brand/analytics" },
  { icon: Settings, label: "Settings", path: "/brand/settings" },
];

export function BottomNavBarBrand() {
  const location = useLocation();
  const { t } = useLanguage();
  const [sheetOpen, setSheetOpen] = useState(false);
  const { pendingCount } = useBrandPendingCount();
  const { unreadCount } = useBrandMessages();

  const getBadgeCount = (badgeType?: "pending" | "messages") => {
    if (badgeType === "pending") return pendingCount;
    if (badgeType === "messages") return unreadCount;
    return 0;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border md:hidden">
      <div className="flex items-center justify-around py-2">
        {mainNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          const badgeCount = getBadgeCount(item.badgeType);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors relative",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {badgeCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center"
                  >
                    {badgeCount}
                  </Badge>
                )}
              </div>
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center gap-1 px-2 py-2 text-muted-foreground">
              <Menu className="h-5 w-5" />
              <span className="text-xs">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto">
            <div className="flex items-center justify-between py-4 border-b border-border/30 mb-2">
              <span className="text-lg font-semibold">{t('common.moreOptions')}</span>
              <LanguageToggle className="h-9 w-9 border border-border/50 hover:border-primary/50 hover:bg-primary/10" />
            </div>
            <div className="py-4 space-y-2">
              {moreNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSheetOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Icon className="h-5 w-5 text-primary" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
