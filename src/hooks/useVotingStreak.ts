import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface VotingStreakData {
  currentStreak: number;
  votedThisWeek: boolean;
  isLoading: boolean;
}

export function useVotingStreak(): VotingStreakData {
  const { user } = useAuth();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [votedThisWeek, setVotedThisWeek] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const calculateStreak = async () => {
      try {
        // Get votes grouped by week for the last 8 weeks
        const { data, error } = await supabase
          .from("spotlight_votes")
          .select("created_at")
          .eq("fan_user_id", user.id)
          .gte("created_at", new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000).toISOString())
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
          setCurrentStreak(0);
          setVotedThisWeek(false);
          setIsLoading(false);
          return;
        }

        // Group votes by ISO week
        const votesByWeek = new Map<string, boolean>();
        
        data.forEach((vote) => {
          const date = new Date(vote.created_at);
          const weekKey = getISOWeekKey(date);
          votesByWeek.set(weekKey, true);
        });

        // Check current week
        const now = new Date();
        const currentWeekKey = getISOWeekKey(now);
        const hasVotedThisWeek = votesByWeek.has(currentWeekKey);
        setVotedThisWeek(hasVotedThisWeek);

        // Calculate streak
        let streak = 0;
        let checkDate = new Date(now);
        
        // If voted this week, start counting from this week
        // If not, check if they voted last week (streak might still be active)
        if (hasVotedThisWeek) {
          streak = 1;
          checkDate = getPreviousWeekStart(checkDate);
        } else {
          // Check if last week had a vote - if not, streak is 0
          const lastWeekKey = getISOWeekKey(getPreviousWeekStart(now));
          if (!votesByWeek.has(lastWeekKey)) {
            setCurrentStreak(0);
            setIsLoading(false);
            return;
          }
        }

        // Count consecutive weeks backwards
        for (let i = 0; i < 7; i++) {
          const weekKey = getISOWeekKey(checkDate);
          if (votesByWeek.has(weekKey)) {
            streak++;
            checkDate = getPreviousWeekStart(checkDate);
          } else {
            break;
          }
        }

        setCurrentStreak(streak);
      } catch (err) {
        console.error("Error calculating voting streak:", err);
      } finally {
        setIsLoading(false);
      }
    };

    calculateStreak();
  }, [user]);

  return { currentStreak, votedThisWeek, isLoading };
}

// Get ISO week key (YYYY-WW format)
function getISOWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  // Set to Thursday of the week to get correct ISO week
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNumber = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-${weekNumber.toString().padStart(2, "0")}`;
}

// Get start of previous week (Monday)
function getPreviousWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) - 7;
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
