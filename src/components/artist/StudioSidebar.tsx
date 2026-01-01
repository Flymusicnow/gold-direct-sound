import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, User, Music, Calendar, BarChart3, MessageSquare, Sparkles, Video, FolderOpen, Crown, Star, Users, ShoppingBag, Radio, DollarSign, Link2, Settings, FileText, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { FlyMusicLogo } from "@/components/FlyMusicLogo";
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

export function StudioSidebar() {
  const location = useLocation();
  const { t } = useLanguage();

  return (
    <aside className="w-64 h-[calc(100vh-64px)] overflow-hidden bg-[hsl(0,0%,5%)] border-r border-border/50 flex flex-col shadow-elegant z-40 hidden md:flex">
      {/* Header - FIXED */}
      <div className="flex-shrink-0 p-6 pb-6 border-b border-border/30">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <FlyMusicLogo size="sm" />
            <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {t('nav.myStudio')}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <LanguageToggle className="h-8 w-8 border border-border/50 hover:border-primary/50 hover:bg-primary/10" />
            <NotificationBell />
          </div>
        </div>
        <p className="text-xs text-muted-foreground ml-10">{t('studio.creatorControlRoom')}</p>
      </div>

      {/* Menu - SCROLLABLE ONLY IF OVERFLOW */}
      <nav className="flex-1 min-h-0 overflow-y-auto p-6 pt-4 space-y-1 scrollbar-auto-hide">
        {navSections.map((section, sectionIndex) => (
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

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 border-l-2",
                    isActive
                      ? "border-primary bg-primary/10 text-primary font-semibold shadow-sm"
                      : "border-transparent text-muted-foreground hover:bg-muted/30 hover:text-foreground hover:border-muted"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
