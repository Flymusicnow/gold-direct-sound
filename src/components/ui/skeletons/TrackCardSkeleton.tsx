import { Skeleton } from "@/components/ui/skeleton";

export function TrackCardSkeleton() {
  return (
    <div className="flex items-center gap-3.5 md:gap-4 px-3.5 py-3 md:p-4 min-h-[88px] md:min-h-0 rounded-[14px] bg-card border border-border">
      <Skeleton className="w-[60px] h-[60px] md:w-16 md:h-16 rounded-lg flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <Skeleton className="h-8 w-8 md:h-9 md:w-9 rounded-full" />
        <Skeleton className="h-8 w-8 md:h-9 md:w-9 rounded-full" />
        <Skeleton className="h-8 w-8 md:h-9 md:w-9 rounded-full" />
      </div>
    </div>
  );
}
