import React from 'react';
import { MissionCard } from './MissionCard';
import { useMissions } from '@/hooks/useMissions';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="daily" className="gap-2">
          <Calendar className="h-4 w-4" />
          Daily ({completedDaily}/{dailyMissions.length})
        </TabsTrigger>
        <TabsTrigger value="weekly" className="gap-2">
          <CalendarDays className="h-4 w-4" />
          Weekly ({completedWeekly}/{weeklyMissions.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="daily" className="space-y-3 mt-0">
        {dailyMissions.map(mission => (
          <MissionCard
            key={mission.id}
            mission={mission}
            progress={progress[mission.id]?.progress || 0}
            completed={!!progress[mission.id]?.completed_at}
          />
        ))}
      </TabsContent>

      <TabsContent value="weekly" className="space-y-3 mt-0">
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
