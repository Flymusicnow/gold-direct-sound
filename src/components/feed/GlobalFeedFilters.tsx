import { FeedFilter } from "@/hooks/useGlobalFeed";
import { cn } from "@/lib/utils";

const FILTERS: { key: FeedFilter; label: string; description?: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'posts', label: 'Posts' },
  { key: 'videos', label: 'Videos' },
  { key: 'new_artists', label: 'New Artists', description: 'Artists joined last 30 days' },
  { key: 'trending', label: 'Trending', description: 'Most active last 7 days' },
];

interface GlobalFeedFiltersProps {
  activeFilter: FeedFilter;
  onFilterChange: (filter: FeedFilter) => void;
}

export function GlobalFeedFilters({ activeFilter, onFilterChange }: GlobalFeedFiltersProps) {
  return (
    <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-none">
      {FILTERS.map((f) => (
        <button
          key={f.key}
          onClick={() => onFilterChange(f.key)}
          title={f.description}
          className={cn(
            "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
            activeFilter === f.key
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          )}
        >
          {f.label}
        </button>
      ))}
      {activeFilter === 'trending' && (
        <p className="flex-shrink-0 text-xs text-muted-foreground self-center px-1">
          — ranked by reactions + comments, last 7 days
        </p>
      )}
    </div>
  );
}
