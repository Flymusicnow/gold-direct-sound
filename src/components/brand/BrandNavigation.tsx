import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { FlyMusicLogo } from "@/components/FlyMusicLogo";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Inbox,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/brand" },
  { icon: Users, label: "Discover Artists", path: "/brand/discovery" },
  { icon: Briefcase, label: "Opportunities", path: "/brand/opportunities" },
  { icon: Inbox, label: "Applications", path: "/brand/applications", hasBadge: true },
  { icon: BarChart3, label: "Analytics", path: "/brand/analytics" },
];

export function BrandNavigation() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [brandName, setBrandName] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadBrandData();
    }
  }, [user]);

  const loadBrandData = async () => {
    if (!user) return;

    try {
      // Get brand entity for this user
      const { data: adminData } = await supabase
        .from("collab_entity_admins")
        .select("collab_entity_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!adminData) return;

      // Get brand name
      const { data: entity } = await supabase
        .from("collab_entities")
        .select("name")
        .eq("id", adminData.collab_entity_id)
        .maybeSingle();

      if (entity) {
        setBrandName(entity.name);
      }

      // Get opportunities for this entity
      const { data: opps } = await supabase
        .from("collab_opportunities")
        .select("id")
        .eq("collab_entity_id", adminData.collab_entity_id);

      if (opps && opps.length > 0) {
        const oppIds = opps.map((o) => o.id);

        // Get pending applications count
        const { count } = await supabase
          .from("collab_applications")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending")
          .in("opportunity_id", oppIds);

        setPendingCount(count || 0);
      }
    } catch (error) {
      console.error("Error loading brand data:", error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border h-16">
      <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
        {/* Left: Logo */}
        <Link to="/brand" className="flex items-center gap-2">
          <FlyMusicLogo size="sm" />
          <span className="text-lg font-bold hidden sm:inline bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Brand Portal
          </span>
        </Link>

        {/* Center: Navigation Links (desktop) */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {item.hasBadge && pendingCount > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs">
                    {pendingCount}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: Notifications + Account */}
        <div className="flex items-center gap-2">
          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={undefined} />
                  <AvatarFallback className="text-xs">
                    {brandName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "B"}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm font-medium max-w-[100px] truncate">
                  {brandName || "Account"}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link to="/brand/settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="flex items-center gap-2 text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
