import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { FlyMusicLogo } from "@/components/FlyMusicLogo";
import {
  LayoutDashboard,
  Users,
  Star,
  KeyRound,
  Flag,
  Mail,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navSections = [
  {
    title: "Overview",
    items: [
      { 
        title: "Dashboard", 
        url: "/admin", 
        icon: LayoutDashboard,
        description: "Se översikt av plattformens aktivitet, statistik och nyckeltal i realtid"
      },
      { 
        title: "Inbox", 
        url: "/admin/inbox", 
        icon: Inbox, 
        badgeType: 'inbox' as const,
        description: "Läs och besvara meddelanden från artister och fans. Hantera supportärenden"
      },
      { 
        title: "QA Mode", 
        url: "/admin/qa", 
        icon: FlaskConical,
        description: "Testa funktioner innan de går live. Simulera olika användarroller och scenarier"
      },
    ]
  },
  {
    title: "Content",
    items: [
      { 
        title: "Approvals", 
        url: "/admin/approvals", 
        icon: Shield,
        description: "Granska och godkänn väntande artistansökningar. Se profil och musik innan godkännande"
      },
      { 
        title: "Verifications", 
        url: "/admin/verifications", 
        icon: CheckCircle,
        description: "Verifiera identitet på artister med blå bock. Granska dokumentation och sociala medier"
      },
      { 
        title: "Users", 
        url: "/admin/users", 
        icon: Users,
        description: "Sök, visa och hantera användarkonton. Se aktivitet, roller och kontohistorik"
      },
      { 
        title: "Artists", 
        url: "/admin/artists", 
        icon: Star,
        description: "Se alla artister på plattformen. Redigera profiler, statistik och hantera status"
      },
      { 
        title: "Tracks", 
        url: "/admin/tracks", 
        icon: Activity,
        description: "Hantera uppladdade låtar. Redigera metadata, granska innehåll och moderera"
      },
      { 
        title: "Smart Links", 
        url: "/admin/smart-links", 
        icon: Link2,
        description: "Administrera smarta delningslänkar. Se klickstatistik och hantera redirects"
      },
      { 
        title: "Spotlight", 
        url: "/admin/spotlight", 
        icon: Star,
        description: "Hantera veckovisa Spotlight-kampanjer. Välj featured artister och sätt regler"
      },
      { 
        title: "Updates", 
        url: "/admin/updates", 
        icon: Bell,
        description: "Publicera plattformsuppdateringar och changelog. Skicka notiser till användare"
      },
    ]
  },
  {
    title: "Partnerships",
    items: [
      { 
        title: "Collab Entities", 
        url: "/admin/collab-entities", 
        icon: Building2,
        description: "Skapa och hantera samarbetspartners som labels, venues och brands"
      },
      { 
        title: "Opportunities", 
        url: "/admin/opportunities", 
        icon: Briefcase,
        description: "Skapa nya samarbetsmöjligheter som artister kan ansöka till"
      },
      { 
        title: "Matching", 
        url: "/admin/matching", 
        icon: Handshake,
        description: "Matcha artister med passande brands automatiskt baserat på profil och stil"
      },
      { 
        title: "Brand Applications", 
        url: "/admin/brand-applications", 
        icon: Building2, 
        badgeType: 'brand' as const,
        description: "Granska företag som ansöker om brand-konto. Verifiera och godkänn nya partners"
      },
      { 
        title: "Campaigns", 
        url: "/admin/campaigns", 
        icon: Activity,
        description: "Följ upp aktiva marknadsföringskampanjer. Se resultat och hantera budgetar"
      },
    ]
  },
  {
    title: "System",
    items: [
      { 
        title: "Flight Recorder", 
        url: "/admin/flight-recorder", 
        icon: Activity,
        description: "End-to-end flow debugging. View telemetry, trace errors, and analyze user journeys"
      },
      { 
        title: "Beta Codes", 
        url: "/admin/beta-codes", 
        icon: KeyRound,
        description: "Generera och spåra betakoder för early access. Se vilka som använt koder"
      },
      { 
        title: "Waitlist", 
        url: "/admin/waitlist", 
        icon: Mail,
        description: "Se väntelistan med registrerade intressenter. Bjud in och prioritera användare"
      },
      { 
        title: "Feature Flags", 
        url: "/admin/features", 
        icon: Flag,
        description: "Aktivera/inaktivera funktioner per användare eller globalt. A/B-testa features"
      },
      { 
        title: "Activity Log", 
        url: "/admin/activity", 
        icon: Activity,
        description: "Se all adminaktivitet och ändringar. Spåra vem som gjort vad och när"
      },
      { 
        title: "Payouts", 
        url: "/admin/payouts", 
        icon: CreditCard,
        description: "Hantera utbetalningar till artister. Se saldo, historik och initiera betalningar"
      },
      { 
        title: "Roles", 
        url: "/admin/roles", 
        icon: Shield,
        description: "Tilldela adminroller och behörigheter. Hantera vem som kan göra vad i panelen"
      },
    ]
  }
];

export function AdminSidebar() {
  const location = useLocation();
  const { signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [inboxCounts, setInboxCounts] = useState({ unread: 0, inProgress: 0 });
  const [brandAppCount, setBrandAppCount] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Fetch inbox counts
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

        // Fetch pending brand applications count
        const { count: pendingBrand } = await supabase
          .from("brand_applications")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");

        setBrandAppCount(pendingBrand || 0);
      } catch (error) {
        console.error("Error fetching counts:", error);
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalInboxActive = inboxCounts.unread + inboxCounts.inProgress;
  const hasUnread = inboxCounts.unread > 0;

  // Get badge info for an item
  const getBadgeInfo = (badgeType?: 'inbox' | 'brand') => {
    if (badgeType === 'inbox' && totalInboxActive > 0) {
      return { count: totalInboxActive, isUrgent: hasUnread };
    }
    if (badgeType === 'brand' && brandAppCount > 0) {
      return { count: brandAppCount, isUrgent: true };
    }
    return null;
  };

  return (
    <TooltipProvider delayDuration={300}>
      <aside
        className={cn(
          "h-screen overflow-hidden bg-card border-r border-border flex flex-col transition-all duration-300",
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(!collapsed)}
                className="h-8 w-8"
              >
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{collapsed ? "Expandera sidopanelen" : "Minimera sidopanelen"}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Navigation */}
        <nav className="flex-1 min-h-0 p-2 overflow-y-auto scrollbar-auto-hide">
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
                  
                  const badgeInfo = getBadgeInfo((item as any).badgeType);
                  
                  const navLink = (
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
                      {badgeInfo && !collapsed && (
                        <span
                          className={cn(
                            "text-xs font-medium px-1.5 py-0.5 rounded-full",
                            badgeInfo.isUrgent
                              ? "bg-destructive text-destructive-foreground"
                              : "bg-yellow-500 text-yellow-50"
                          )}
                        >
                          {badgeInfo.count}
                        </span>
                      )}
                      {badgeInfo && collapsed && (
                        <span
                          className={cn(
                            "absolute top-1 right-1 w-2 h-2 rounded-full",
                            badgeInfo.isUrgent ? "bg-destructive" : "bg-yellow-500"
                          )}
                        />
                      )}
                    </RouterNavLink>
                  );
                  
                  return (
                    <Tooltip key={item.url}>
                      <TooltipTrigger asChild>
                        {navLink}
                      </TooltipTrigger>
                      <TooltipContent 
                        side="right" 
                        className="max-w-xs"
                        sideOffset={8}
                      >
                        <div className="space-y-1">
                          {collapsed && (
                            <p className="font-semibold text-sm">{item.title}</p>
                          )}
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer with Logout */}
        <div className="p-4 border-t border-border space-y-3">
          <Tooltip>
            <TooltipTrigger asChild>
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
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Logga ut från admin-panelen</p>
            </TooltipContent>
          </Tooltip>
          {!collapsed && (
            <p className="text-xs text-muted-foreground">FlyMusic Admin Panel</p>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
