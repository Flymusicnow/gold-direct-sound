import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, User, Music, Video, Calendar, BarChart3, MessageSquare, Users, ShoppingBag, Radio, Star, Crown, Menu, Search, X, FolderOpen, Sparkles, Settings, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { motion } from "framer-motion";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/studio" },
  { icon: User, label: "Profile", path: "/studio/profile" },
  { icon: Music, label: "Tracks", path: "/studio/tracks" },
  { icon: Video, label: "Videos", path: "/studio/videos" },
  { icon: FolderOpen, label: "Video Collections", path: "/studio/video-collections" },
  { icon: FileText, label: "Press Kit", path: "/studio/presskit" },
  { icon: Users, label: "Collaborations", path: "/studio/collaborations" },
  { icon: ShoppingBag, label: "Merch", path: "/studio/merch" },
  { icon: Radio, label: "Live", path: "/studio/live" },
  { icon: Calendar, label: "Events", path: "/studio/events" },
  { icon: Sparkles, label: "Spotlight", path: "/studio/spotlight" },
  { icon: BarChart3, label: "Analytics", path: "/studio/analytics" },
  { icon: MessageSquare, label: "Comments", path: "/studio/comments" },
  { icon: Star, label: "Testimonials", path: "/studio/testimonials" },
  { icon: Crown, label: "Membership", path: "/studio/subscription" },
  { icon: Settings, label: "Settings", path: "/studio/settings" },
];

interface MobileStudioNavProps {
  inSheet?: boolean;
  onNavigate?: () => void;
}

export function MobileStudioNav({ inSheet = false, onNavigate }: MobileStudioNavProps = {}) {
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useSwipeGesture({
    onSwipeLeft: () => setSheetOpen(false),
    enabled: sheetOpen,
  });

  const filteredItems = navItems.filter(item => 
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNavigate = () => {
    setSheetOpen(false);
    onNavigate?.();
  };

  if (inSheet) {
    return (
      <div className="flex flex-col h-full max-h-[calc(85vh-4rem)] overflow-hidden">
        {/* Header - fixed */}
        <div className="flex-shrink-0 pb-4 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-gold flex items-center justify-center flex-shrink-0">
              <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              My Studio
            </h2>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 bg-muted/30"
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

        {/* Nav items - scrollable */}
        <motion.nav 
          className="flex-1 overflow-y-auto space-y-1 pb-safe"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.05
              }
            }
          }}
        >
          {filteredItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No results found</p>
          ) : (
            filteredItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.path}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { 
                      opacity: 1, 
                      y: 0,
                      transition: {
                        duration: 0.3,
                        ease: "easeOut"
                      }
                    }
                  }}
                >
                  <Link
                    to={item.path}
                    onClick={handleNavigate}
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
                </motion.div>
              );
            })
          )}
        </motion.nav>
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
      <SheetContent side="left" className="w-64 bg-[hsl(0,0%,5%)] border-r border-border/50">
        <SheetHeader className="mb-6 pb-4 border-b border-border/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-gold flex items-center justify-center">
              <LayoutDashboard className="h-4 w-4 text-primary-foreground" />
            </div>
            <SheetTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              My Studio
            </SheetTitle>
          </div>
        </SheetHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 bg-muted/30"
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

        <motion.nav 
          className="space-y-1"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.05
              }
            }
          }}
        >
          {filteredItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No results found</p>
          ) : (
            filteredItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

              return (
                <motion.div
                  key={item.path}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { 
                      opacity: 1, 
                      y: 0,
                      transition: {
                        duration: 0.3,
                        ease: "easeOut"
                      }
                    }
                  }}
                >
                  <Link
                    to={item.path}
                    onClick={() => setSheetOpen(false)}
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
                </motion.div>
              );
            })
          )}
        </motion.nav>
      </SheetContent>
    </Sheet>
  );
}
