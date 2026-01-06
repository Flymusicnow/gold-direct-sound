import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "gold" | "circular" | "text";
}

function Skeleton({ className, variant = "gold", ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted relative overflow-hidden",
        variant === "gold" && "skeleton-gold-shimmer",
        variant === "default" && "animate-pulse",
        variant === "circular" && "rounded-full skeleton-gold-shimmer",
        variant === "text" && "h-4 rounded skeleton-gold-shimmer",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
