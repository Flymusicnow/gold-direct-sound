import { Skeleton } from "@/components/ui/skeleton";

export function ArtistCardSkeleton() {
  return (
    <div className="p-6 rounded-xl bg-card border border-border/50">
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-16 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}
