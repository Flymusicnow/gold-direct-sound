import { Skeleton } from "@/components/ui/skeleton";

export function TrackCardSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-card/50 border border-border/50">
      <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
    </div>
  );
}
