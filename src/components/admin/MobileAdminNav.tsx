import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Shield, Users, Mic2, Music, Sparkles, Key, DollarSign, 
  ToggleRight, Building2, Target, Activity, Menu, Search, X, FlaskConical, 
  Link2, Megaphone, Mail
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { LanguageToggle } from "@/components/LanguageToggle";

const navSections = [
  {
    title: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
      { icon: Mail, label: "Inbox", path: "/admin/inbox" },
      { icon: FlaskConical, label: "QA Mode", path: "/admin/qa" },
    ]
  },
  {
    title: "Content",
    items: [
      { icon: Shield, label: "Approvals", path: "/admin/approvals" },
      { icon: Users, label: "Users", path: "/admin/users" },
      { icon: Mic2, label: "Artists", path: "/admin/artists" },
      { icon: Music, label: "Tracks", path: "/admin/tracks" },
      { icon: Link2, label: "Smart Links", path: "/admin/smart-links" },
      { icon: Sparkles, label: "Spotlight", path: "/admin/spotlight" },
    ]
  },
  {
    title: "Partnerships",
    items: [
      { icon: Building2, label: "Collab Entities", path: "/admin/collab-entities" },
      { icon: Target, label: "Matching", path: "/admin/matching" },
      { icon: Building2, label: "Brand Apps", path: "/admin/brand-applications" },
      { icon: Megaphone, label: "Campaigns", path: "/admin/campaigns" },
    ]
  },
  {
    title: "System",
    items: [
      { icon: Key, label: "Beta Codes", path: "/admin/beta-codes" },
      { icon: ToggleRight, label: "Features", path: "/admin/features" },
      { icon: Activity, label: "Activity", path: "/admin/activity" },
      { icon: DollarSign, label: "Payouts", path: "/admin/payouts" },
      { icon: Shield, label: "Roles", path: "/admin/roles" },
    ]
  }
];

// Flatten for search functionality
const allNavItems = navSections.flatMap(section => section.items);

interface MobileAdminNavProps {
  inSheet?: boolean;
  onNavigate?: () => void;
}

export function MobileAdminNav({ inSheet = false, onNavigate }: MobileAdminNavProps = {}) {
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useSwipeGesture({
    onSwipeLeft: () => setSheetOpen(false),
    enabled: sheetOpen,
  });

  const handleNavigate = () => {
    setSheetOpen(false);
    onNavigate?.();
  };

  const isItemActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const renderNavContent = (onItemClick: () => void) => {
    // If searching, show flat filtered list
    if (searchQuery) {
      const filteredItems = allNavItems.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (filteredItems.length === 0) {
        return <p className="text-sm text-muted-foreground text-center py-4">No results found</p>;
      }

      return filteredItems.map((item) => {
        const isActive = isItemActive(item.path);
        const Icon = item.icon;

        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onItemClick}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 border-l-2",
              isActive
                ? "border-primary bg-primary/10 text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:bg-muted/30 hover:text-foreground"
            )}
          >
            <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
            <span>{item.label}</span>
          </Link>
        );
      });
    }

    // Show sectioned navigation
    return navSections.map((section, sectionIndex) => (
      <div key={section.title}>
        {sectionIndex > 0 && (
          <div className="my-3 border-t border-border/30" />
        )}
        <p className="px-4 py-2 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
          {section.title}
        </p>
        {section.items.map((item) => {
          const isActive = isItemActive(item.path);
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onItemClick}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 border-l-2",
                isActive
                  ? "border-primary bg-primary/10 text-primary font-semibold"
                  : "border-transparent text-muted-foreground hover:bg-muted/30 hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    ));
  };

  if (inSheet) {
    return (
      <div className="flex flex-col h-full max-h-[65vh]">
        <div className="flex-shrink-0 space-y-4 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-gold flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Admin Portal
              </h2>
            </div>
            <LanguageToggle className="h-9 w-9 border border-border/50 hover:border-primary/50 hover:bg-primary/10" />
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 bg-muted/30"
              autoFocus={false}
              autoComplete="off"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 -mx-2 px-2">
          <nav className="space-y-1 pb-safe">
            {renderNavContent(handleNavigate)}
          </nav>
        </ScrollArea>
      </div>
    );
  }

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>
        <Button
          variant="default"
          size="icon"
          className="fixed bottom-6 right-6 z-50 md:hidden h-14 w-14 rounded-full shadow-gold"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="left" 
        className="w-64 bg-[hsl(0,0%,5%)] border-r border-border/50"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetHeader className="mb-6 pb-4 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-gold flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              <SheetTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Admin Portal
              </SheetTitle>
            </div>
            <LanguageToggle className="h-8 w-8 border border-border/50 hover:border-primary/50 hover:bg-primary/10" />
          </div>
        </SheetHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 bg-muted/30"
            autoFocus={false}
            autoComplete="off"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        <ScrollArea className="h-[calc(100vh-200px)]">
          <nav className="space-y-1 pb-safe">
            {renderNavContent(() => setSheetOpen(false))}
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
