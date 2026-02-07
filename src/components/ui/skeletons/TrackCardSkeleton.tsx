import { Skeleton } from "@/components/ui/skeleton";

export function TrackCardSkeleton() {
  return (
    <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 h-[68px] md:h-auto rounded-xl bg-card border border-border">
      <Skeleton className="w-14 h-14 md:w-16 md:h-16 rounded-lg flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Skeleton className="h-8 w-8 md:h-9 md:w-9 rounded-full" />
        <Skeleton className="h-8 w-8 md:h-9 md:w-9 rounded-full" />
        <Skeleton className="h-8 w-8 md:h-9 md:w-9 rounded-full" />
      </div>
    </div>
  );
}
