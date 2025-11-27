import { useEffect, useRef } from "react";
import { LucideIcon } from "lucide-react";
import { useAnimatedCounter } from "@/hooks/use-animated-counter";

interface StatsCounterProps {
  icon: LucideIcon;
  value: number;
  label: string;
  suffix?: string;
}

export function StatsCounter({ icon: Icon, value, label, suffix = "" }: StatsCounterProps) {
  const { count, start, hasStarted } = useAnimatedCounter(value, 2000);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasStarted) {
          start();
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [start, hasStarted]);

  return (
    <div 
      ref={ref}
      className="flex flex-col items-center justify-center gap-4 p-6 hover:scale-105 transition-transform duration-300"
    >
      <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <div className="text-center">
        <p className="text-4xl md:text-5xl font-bold text-primary">
          {count}{suffix}
        </p>
        <p className="text-sm text-muted-foreground uppercase tracking-wider mt-2">
          {label}
        </p>
      </div>
    </div>
  );
}
