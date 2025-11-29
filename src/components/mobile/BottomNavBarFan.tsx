import { Link, useLocation } from "react-router-dom";
import { Home, Rss, Users, ListMusic, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MobileFanNav } from "@/components/fan/MobileFanNav";

const mainNavItems = [
  { icon: Home, label: "Home", path: "/fan" },
  { icon: Rss, label: "Feed", path: "/fan/feed" },
  { icon: Users, label: "Artists", path: "/fan/artists" },
  { icon: ListMusic, label: "Playlists", path: "/fan/playlists" },
];

export function BottomNavBarFan() {
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-background/95 backdrop-blur-sm pb-safe">
      <nav className="flex items-center justify-around h-14 px-2">
        {mainNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-lg transition-colors min-w-[64px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-primary rounded-t-full" />
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
          <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
            <MobileFanNav inSheet onNavigate={() => setSheetOpen(false)} />
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}
