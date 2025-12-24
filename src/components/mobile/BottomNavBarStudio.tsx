import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Music, BarChart3, Radio, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MobileStudioNav } from "@/components/artist/MobileStudioNav";

const mainNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/studio" },
  { icon: Music, label: "Tracks", path: "/studio/tracks" },
  { icon: BarChart3, label: "Analytics", path: "/studio/analytics" },
  { icon: Radio, label: "Live", path: "/studio/live" },
];

export function BottomNavBarStudio() {
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (sheetOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sheetOpen]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-background/95 backdrop-blur-sm pb-safe">
      <nav className="flex items-center justify-around h-16 px-4">
        {mainNavItems.map((item) => {
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
              <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-0 w-12 h-0.5 bg-primary rounded-t-full transition-all duration-300 animate-fade-in" />
              )}
            </Link>
          );
        })}

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground active:scale-95 min-w-[64px] min-h-[44px]">
              <Menu className="h-5 w-5" />
              <span className="text-xs font-medium">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl flex flex-col" onOpenAutoFocus={(e) => e.preventDefault()}>
            <MobileStudioNav inSheet onNavigate={() => setSheetOpen(false)} />
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}
