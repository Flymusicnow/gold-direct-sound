import { Skeleton } from "@/components/ui/skeleton";

export function VideoCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-card border border-border/50">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </div>
    </div>
  );
}
