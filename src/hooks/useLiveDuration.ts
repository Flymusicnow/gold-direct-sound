import { useState, useEffect, useRef } from "react";

export const useLiveDuration = (startTime: string | null, isLive: boolean) => {
  const [duration, setDuration] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isLive || !startTime) {
      setDuration(0);
      return;
    }

    const startDate = new Date(startTime).getTime();

    const updateDuration = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startDate) / 1000);
      setDuration(Math.max(0, elapsed));
    };

    // Initial update
    updateDuration();

    // Update every second
    intervalRef.current = setInterval(updateDuration, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [startTime, isLive]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  return {
    duration,
    formatted: formatDuration(duration),
  };
};
