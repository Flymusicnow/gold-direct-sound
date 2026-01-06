import { Home, Rss } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface DashboardFeedSwitchProps {
  className?: string;
}

export function DashboardFeedSwitch({ className }: DashboardFeedSwitchProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const isDashboard = location.pathname === "/fan/dashboard";
  const isFeed = location.pathname === "/fan/feed";

  const tabs = [
    { id: "dashboard", path: "/fan/dashboard", icon: Home, label: t('nav.dashboard') },
    { id: "feed", path: "/fan/feed", icon: Rss, label: t('nav.feed') },
  ];

  const activeTab = isDashboard ? "dashboard" : isFeed ? "feed" : null;

  if (!activeTab) return null;

  return (
    <div className={cn(
      "inline-flex items-center gap-1 p-1 rounded-full bg-muted/50 border border-border",
      className
    )}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        
        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            className={cn(
              "relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
              isActive 
                ? "text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="dashboardFeedActiveTab"
                className="absolute inset-0 bg-primary rounded-full"
                transition={{ type: "spring", duration: 0.3 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
