import React from 'react';
import { MissionCard } from './MissionCard';
import { useMissions } from '@/hooks/useMissions';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList } from '@/components/ui/tabs';
import { ScrollableTabsList } from '@/components/ui/ScrollableTabs';
import { AnimatedTabTrigger } from '@/components/ui/AnimatedTabTrigger';
import { Calendar, CalendarDays } from 'lucide-react';

export function MissionsList() {
  const { dailyMissions, weeklyMissions, progress, loading } = useMissions();

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const completedDaily = dailyMissions.filter(m => progress[m.id]?.completed_at).length;
  const completedWeekly = weeklyMissions.filter(m => progress[m.id]?.completed_at).length;

  return (
    <Tabs defaultValue="daily" className="w-full">
      <ScrollableTabsList sticky={false}>
        <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none p-0 h-auto gap-0 min-w-max md:min-w-0 mb-4">
          <AnimatedTabTrigger value="daily" icon={<Calendar className="w-4 h-4" />} layoutId="missionsTabs">
            Daily ({completedDaily}/{dailyMissions.length})
          </AnimatedTabTrigger>
          <AnimatedTabTrigger value="weekly" icon={<CalendarDays className="w-4 h-4" />} layoutId="missionsTabs">
            Weekly ({completedWeekly}/{weeklyMissions.length})
          </AnimatedTabTrigger>
        </TabsList>
      </ScrollableTabsList>

      <TabsContent value="daily" className="space-y-3 mt-2">
        {dailyMissions.map(mission => (
          <MissionCard
            key={mission.id}
            mission={mission}
            progress={progress[mission.id]?.progress || 0}
            completed={!!progress[mission.id]?.completed_at}
          />
        ))}
      </TabsContent>

      <TabsContent value="weekly" className="space-y-3 mt-2">
        {weeklyMissions.map(mission => (
          <MissionCard
            key={mission.id}
            mission={mission}
            progress={progress[mission.id]?.progress || 0}
            completed={!!progress[mission.id]?.completed_at}
          />
        ))}
      </TabsContent>
    </Tabs>
  );
}
