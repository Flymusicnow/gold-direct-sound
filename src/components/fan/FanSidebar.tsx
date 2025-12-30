import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { FlyMusicLogo } from "@/components/FlyMusicLogo";
import { fanNavConfig } from "@/config/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";

export function FanSidebar() {
  const location = useLocation();
  const { t } = useLanguage();

  return (
    <aside className="w-64 h-screen overflow-hidden bg-[hsl(0,0%,5%)] border-r border-border/50 flex flex-col shadow-elegant z-40 hidden md:flex">
      {/* Header - FIXED */}
      <div className="flex-shrink-0 p-6 pb-6 border-b border-border/30">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <FlyMusicLogo size="sm" />
            <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {t(fanNavConfig.portalNameI18nKey) || fanNavConfig.portalName}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <LanguageToggle className="h-8 w-8" />
            <NotificationBell />
          </div>
        </div>
        <p className="text-xs text-muted-foreground ml-10">{t('fan.portalSubtitle')}</p>
      </div>

      {/* Menu - SCROLLABLE ONLY IF OVERFLOW */}
      <nav className="flex-1 min-h-0 overflow-y-auto p-6 pt-4 space-y-1 scrollbar-auto-hide">
        {fanNavConfig.sections.map((section, sectionIndex) => (
          <div key={section.title}>
            {sectionIndex > 0 && (
              <div className="my-3 border-t border-border/30" />
            )}
            <p className="px-4 py-2 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
              {section.i18nKey ? t(section.i18nKey) : section.title}
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
                  <span>{item.i18nKey ? t(item.i18nKey) : item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
