import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, User, Music, Calendar, BarChart3, MessageSquare, Menu, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/studio" },
  { icon: User, label: "Profile", path: "/studio/profile" },
  { icon: Music, label: "Tracks", path: "/studio/tracks" },
  { icon: Video, label: "Videos", path: "/studio/videos" },
  { icon: Calendar, label: "Events", path: "/studio/events" },
  { icon: BarChart3, label: "Analytics", path: "/studio/analytics" },
  { icon: MessageSquare, label: "Comments", path: "/studio/comments" },
];

export function MobileStudioNav() {
  const location = useLocation();

  return (
    <Sheet>
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

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
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
        </nav>
      </SheetContent>
    </Sheet>
  );
}
