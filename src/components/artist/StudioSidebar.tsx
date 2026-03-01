import { Link, useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { FlyMusicLogo } from "@/components/FlyMusicLogo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { safeT } from "@/lib/i18nSafe";
import { useUserAccessState } from "@/hooks/useUserAccessState";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { artistNavConfig } from "@/config/navigation";
import { useFeatureFlags, FeatureFlagKey } from "@/contexts/FeatureFlagContext";

// Map nav item paths to the feature flags that gate them
const GATED_NAV_PATHS: Record<string, FeatureFlagKey> = {
  '/studio/spotlight': 'spotlight_enabled',
  '/studio/earnings': 'earnings_dashboard_enabled',
  '/studio/merch': 'merch_enabled',
  '/studio/live': 'livestream_enabled',
  '/studio/events': 'events_enabled',
  '/studio/promo': 'promo_links_enabled',
  '/studio/subscription': 'subscriptions_enabled',
  '/studio/opportunities': 'brand_opportunities_enabled',
  '/studio/collaborations': 'brand_opportunities_enabled',
};

// Paths that are always hidden regardless of flags
const ALWAYS_HIDDEN_PATHS = new Set(['/studio/pulse']);

// Onboarding progress banner component
function OnboardingProgressBanner() {
  const { artistOnboarded } = useUserAccessState();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  if (artistOnboarded) return null;
  
  const savedStep = sessionStorage.getItem('studio-onboarding-step');
  const currentStep = savedStep ? parseInt(savedStep, 10) : 0;
  const totalSteps = 4;
  const progress = Math.round((currentStep / totalSteps) * 100);
  
  return (
    <div className="mx-4 mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
      <div className="flex items-center gap-2 mb-2">
        <CheckCircle2 className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium text-primary">
          {t('studio.onboarding.setupProgress')}
        </span>
      </div>
      <Progress value={progress} className="h-1.5 mb-2" />
      <p className="text-xs text-muted-foreground">
        {t('studio.onboarding.stepOfTotal')
          .replace('{current}', String(currentStep))
          .replace('{total}', String(totalSteps))}
      </p>
      <Button 
        variant="ghost" 
        size="sm" 
        className="w-full mt-2 text-xs h-7"
        onClick={() => navigate('/studio/onboarding')}
      >
        {t('studio.onboarding.continueSetup')}
      </Button>
    </div>
  );
}

export function StudioSidebar() {
  const location = useLocation();
  const { t } = useLanguage();
  const { isEnabled } = useFeatureFlags();

  const isItemVisible = (path: string): boolean => {
    if (ALWAYS_HIDDEN_PATHS.has(path)) return false;
    const flagKey = GATED_NAV_PATHS[path];
    if (flagKey) return isEnabled(flagKey);
    return true;
  };

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
        <p className="text-xs text-muted-foreground ml-10">{safeT(t, 'studio.creatorControlRoom', 'Creator Control Room')}</p>
      </div>

      {/* Onboarding Progress Banner */}
      <OnboardingProgressBanner />

      {/* Menu - SCROLLABLE ONLY IF OVERFLOW */}
      <nav className="flex-1 min-h-0 overflow-y-auto p-6 pt-4 space-y-1 scrollbar-auto-hide">
        {artistNavConfig.sections.map((section, sectionIndex) => {
          const visibleItems = section.items.filter(item => isItemVisible(item.path));
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title}>
              {sectionIndex > 0 && (
                <div className="my-3 border-t border-border/30" />
              )}
              <p className="px-4 py-2 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
                {section.i18nKey ? t(section.i18nKey) : section.title}
              </p>
              {visibleItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg focus-premium",
                      isActive
                        ? "border-l-2 border-primary bg-primary/10 text-primary font-semibold shadow-sm"
                        : "menu-item-premium text-muted-foreground"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
                    <span>{item.i18nKey ? t(item.i18nKey) : item.label}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
