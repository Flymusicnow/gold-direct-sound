import { Link, useLocation } from "react-router-dom";
import { Home, Rss, Menu, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MobileFanNav } from "@/components/fan/MobileFanNav";
import { useFeatureFlags } from "@/contexts/FeatureFlagContext";

const coreNavItems = [
  { icon: Home, label: "Home", path: "/fan/dashboard" },
  { icon: Rss, label: "Feed", path: "/fan/feed" },
  { icon: Compass, label: "Explore", path: "/explore" },
];

export function BottomNavBarFan() {
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="bottom-nav-bar fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-background/95 backdrop-blur-sm pb-safe">
      <nav className="flex items-center justify-around h-16 px-4">
        {coreNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-lg transition-all duration-200 min-w-[64px] min-h-[44px]",
                isActive
                  ? "text-primary scale-105"
                  : "text-muted-foreground hover:text-foreground active:scale-95"
              )}
            >
              <Icon className={cn("h-6 w-6", isActive && "text-primary")} />
              <span className="text-xs font-medium mt-0.5">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-0 w-12 h-0.5 bg-primary rounded-t-full transition-all duration-300 animate-fade-in" />
              )}
            </Link>
          );
        })}

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground active:scale-95 min-w-[64px] min-h-[44px]">
              <Menu className="h-6 w-6" />
              <span className="text-xs font-medium mt-0.5">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
            <MobileFanNav inSheet onNavigate={() => setSheetOpen(false)} />
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}
