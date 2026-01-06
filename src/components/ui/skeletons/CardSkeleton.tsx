import { Skeleton } from "@/components/ui/skeleton";

interface CardSkeletonProps {
  lines?: number;
  showAvatar?: boolean;
}

export function CardSkeleton({ lines = 3, showAvatar = false }: CardSkeletonProps) {
  return (
    <div className="p-6 rounded-xl bg-card border border-border/50">
      {showAvatar && (
        <div className="flex items-center gap-4 mb-4">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-4"
            style={{ width: `${100 - i * 15}%` }}
          />
        ))}
      </div>
    </div>
  );
}
