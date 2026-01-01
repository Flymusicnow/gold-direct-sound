import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, User, Music, Video, Calendar, BarChart3, MessageSquare, 
  Users, ShoppingBag, Radio, Star, Crown, Menu, Search, X, FolderOpen, 
  Sparkles, Settings, FileText, Link2, Briefcase, DollarSign 
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
import { motion } from "framer-motion";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";

const navSections = [
  {
    title: "Content",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/studio" },
      { icon: User, label: "Profile", path: "/studio/profile" },
      { icon: Music, label: "Tracks", path: "/studio/tracks" },
      { icon: Video, label: "Videos", path: "/studio/videos" },
      { icon: FolderOpen, label: "Video Collections", path: "/studio/video-collections" },
      { icon: FileText, label: "Press Kit", path: "/studio/presskit" },
      { icon: Star, label: "Verification", path: "/studio/verification" },
    ]
  },
  {
    title: "Distribution",
    items: [
      { icon: Users, label: "Collaborations", path: "/studio/collaborations" },
      { icon: ShoppingBag, label: "Merch", path: "/studio/merch" },
      { icon: Radio, label: "Live", path: "/studio/live" },
      { icon: Calendar, label: "Events", path: "/studio/events" },
    ]
  },
  {
    title: "Engagement",
    items: [
      { icon: Sparkles, label: "Spotlight", path: "/studio/spotlight" },
      { icon: Link2, label: "Promo Hub", path: "/studio/promo" },
      { icon: BarChart3, label: "Analytics", path: "/studio/analytics" },
      { icon: MessageSquare, label: "Comments", path: "/studio/comments" },
      { icon: Star, label: "Testimonials", path: "/studio/testimonials" },
    ]
  },
  {
    title: "Business",
    items: [
      { icon: Briefcase, label: "Opportunities", path: "/studio/opportunities" },
      { icon: DollarSign, label: "Earnings", path: "/studio/earnings" },
      { icon: Crown, label: "Membership", path: "/studio/subscription" },
      { icon: Settings, label: "Settings", path: "/studio/settings" },
    ]
  }
];

// Flatten for search functionality
const allNavItems = navSections.flatMap(section => section.items);

interface MobileStudioNavProps {
  inSheet?: boolean;
  onNavigate?: () => void;
}

export function MobileStudioNav({ inSheet = false, onNavigate }: MobileStudioNavProps = {}) {
  const location = useLocation();
  const { t } = useLanguage();
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

  const renderNavContent = (onItemClick: () => void, animated = false) => {
    // If searching, show flat filtered list
    if (searchQuery) {
      const filteredItems = allNavItems.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (filteredItems.length === 0) {
        return <p className="text-sm text-muted-foreground text-center py-4">No results found</p>;
      }

      return filteredItems.map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;
        const content = (
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

        if (animated) {
          return (
            <motion.div
              key={item.path}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
              }}
            >
              {content}
            </motion.div>
          );
        }
        return content;
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
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          const content = (
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

          if (animated) {
            return (
              <motion.div
                key={item.path}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
                }}
              >
                {content}
              </motion.div>
            );
          }
          return <div key={item.path}>{content}</div>;
        })}
      </div>
    ));
  };

  if (inSheet) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="flex-shrink-0 pb-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-gold flex items-center justify-center flex-shrink-0">
                <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {t('nav.myStudio')}
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

        <ScrollArea className="flex-1 min-h-0">
          <motion.nav
            className="space-y-1 pb-safe"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.03 } }
            }}
          >
            {renderNavContent(handleNavigate, true)}
          </motion.nav>
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
                <LayoutDashboard className="h-4 w-4 text-primary-foreground" />
              </div>
              <SheetTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {t('nav.myStudio')}
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
          <motion.nav
            className="space-y-1 pb-safe"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.03 } }
            }}
          >
            {renderNavContent(() => setSheetOpen(false), true)}
          </motion.nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
