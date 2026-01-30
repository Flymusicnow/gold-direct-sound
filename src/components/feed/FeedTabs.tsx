import { Tabs, TabsList } from "@/components/ui/tabs";
import { AnimatedTabTrigger } from "@/components/ui/AnimatedTabTrigger";
import { ScrollableTabsList } from "@/components/ui/ScrollableTabs";
import { Music, Video, Star, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export type FeedTab = 'music' | 'videos' | 'spotlight' | 'artists';

interface FeedTabsProps {
  activeTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
  counts?: { music: number; videos: number };
}

export function FeedTabs({ activeTab, onTabChange, counts }: FeedTabsProps) {
  const { t } = useLanguage();

  const tabs = [
    { 
      value: 'music' as FeedTab, 
      label: t('feed.music'), 
      icon: <Music className="h-4 w-4" />,
      count: counts?.music 
    },
    { 
      value: 'videos' as FeedTab, 
      label: t('feed.videos'), 
      icon: <Video className="h-4 w-4" />,
      count: counts?.videos 
    },
    { 
      value: 'spotlight' as FeedTab, 
      label: t('feed.spotlight'), 
      icon: <Star className="h-4 w-4" /> 
    },
    { 
      value: 'artists' as FeedTab, 
      label: t('feed.artists'), 
      icon: <Users className="h-4 w-4" /> 
    },
  ];

  return (
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as FeedTab)}>
      <ScrollableTabsList sticky={false}>
        <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none p-0 h-auto gap-0 min-w-max md:min-w-0">
          {tabs.map((tab) => (
            <AnimatedTabTrigger
              key={tab.value}
              value={tab.value}
              icon={tab.icon}
              layoutId="feedTab"
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({tab.count})
                </span>
              )}
            </AnimatedTabTrigger>
          ))}
        </TabsList>
      </ScrollableTabsList>
    </Tabs>
  );
}
