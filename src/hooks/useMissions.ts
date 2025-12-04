import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Mission {
  id: string;
  mission_key: string;
  mission_type: 'daily' | 'weekly' | 'special';
  title: string;
  description: string | null;
  xp_reward: number;
  icon: string;
  target_count: number;
}

interface MissionProgress {
  mission_id: string;
  progress: number;
  completed_at: string | null;
}

export function useMissions() {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [progress, setProgress] = useState<Record<string, MissionProgress>>({});
  const [loading, setLoading] = useState(true);

  const fetchMissions = useCallback(async () => {
    try {
      const { data: missionsData, error: missionsError } = await supabase
        .from('missions')
        .select('*')
        .eq('is_active', true);

      if (missionsError) throw missionsError;
      setMissions((missionsData || []) as Mission[]);

      if (user) {
        const today = new Date().toISOString().split('T')[0];
        const weekStart = getWeekStart();

        const { data: progressData, error: progressError } = await supabase
          .from('mission_completions')
          .select('*')
          .eq('user_id', user.id)
          .gte('period_start', weekStart);

        if (progressError) throw progressError;

        const progressMap: Record<string, MissionProgress> = {};
        progressData?.forEach((p: any) => {
          progressMap[p.mission_id] = {
            mission_id: p.mission_id,
            progress: p.progress,
            completed_at: p.completed_at,
          };
        });
        setProgress(progressMap);
      }
    } catch (error) {
      console.error('Error fetching missions:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  const updateMissionProgress = useCallback(async (missionKey: string, increment: number = 1) => {
    if (!user) return;

    const mission = missions.find(m => m.mission_key === missionKey);
    if (!mission) return;

    const periodStart = mission.mission_type === 'daily' 
      ? new Date().toISOString().split('T')[0]
      : getWeekStart();

    const currentProgress = progress[mission.id]?.progress || 0;
    const newProgress = Math.min(currentProgress + increment, mission.target_count);
    const isCompleted = newProgress >= mission.target_count;

    try {
      const { error } = await supabase
        .from('mission_completions')
        .upsert({
          user_id: user.id,
          mission_id: mission.id,
          progress: newProgress,
          completed_at: isCompleted ? new Date().toISOString() : null,
          period_start: periodStart,
        }, {
          onConflict: 'user_id,mission_id,period_start',
        });

      if (error) throw error;

      setProgress(prev => ({
        ...prev,
        [mission.id]: {
          mission_id: mission.id,
          progress: newProgress,
          completed_at: isCompleted ? new Date().toISOString() : null,
        },
      }));

      return { completed: isCompleted, xpEarned: isCompleted ? mission.xp_reward : 0 };
    } catch (error) {
      console.error('Error updating mission progress:', error);
      return null;
    }
  }, [user, missions, progress]);

  const dailyMissions = missions.filter(m => m.mission_type === 'daily');
  const weeklyMissions = missions.filter(m => m.mission_type === 'weekly');

  return {
    missions,
    dailyMissions,
    weeklyMissions,
    progress,
    loading,
    updateMissionProgress,
    refetch: fetchMissions,
  };
}

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(now.setDate(diff));
  return weekStart.toISOString().split('T')[0];
}
