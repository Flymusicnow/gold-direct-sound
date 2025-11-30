import { useEffect, useRef } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface VideoMilestone {
  videoId: string;
  previousCount: number;
}

const MILESTONES = [10, 100, 1000, 10000];

const getMilestoneMessage = (milestone: number) => {
  switch (milestone) {
    case 10:
      return { title: "🎉 First Milestone!", message: "Your video is getting noticed!" };
    case 100:
      return { title: "🔥 100 Views!", message: "You're trending!" };
    case 1000:
      return { title: "⭐ 1K Views!", message: "You're going viral!" };
    case 10000:
      return { title: "🚀 10K Views!", message: "Incredible milestone!" };
    default:
      return { title: "🎊 Milestone!", message: "Great achievement!" };
  }
};

const triggerConfetti = () => {
  const count = 100;
  const defaults = {
    origin: { y: 0.7 },
    colors: ["#E8BF1A", "#F4D67A", "#C89F0A"],
  };

  function fire(particleRatio: number, opts: any) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
};

export const useVideoMilestones = (videos: Array<{ id: string; view_count: number }>) => {
  const previousCountsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    videos.forEach((video) => {
      const previousCount = previousCountsRef.current.get(video.id);
      
      // Skip if this is the first time seeing this video
      if (previousCount === undefined) {
        previousCountsRef.current.set(video.id, video.view_count);
        return;
      }

      // Check if any milestone was crossed
      const crossedMilestone = MILESTONES.find(
        (milestone) => previousCount < milestone && video.view_count >= milestone
      );

      if (crossedMilestone) {
        const { title, message } = getMilestoneMessage(crossedMilestone);
        
        toast.success(title, {
          description: message,
          duration: 5000,
        });

        triggerConfetti();
      }

      // Update stored count
      previousCountsRef.current.set(video.id, video.view_count);
    });
  }, [videos]);
};
