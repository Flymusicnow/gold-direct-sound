import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, X } from 'lucide-react';

interface RecentSearchesProps {
  history: string[];
  onItemClick: (query: string) => void;
  onClear: () => void;
}

export function RecentSearches({ history, onItemClick, onClear }: RecentSearchesProps) {
  if (history.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Recent Searches</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {history.map((query, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="cursor-pointer hover:bg-primary/20 transition-colors text-sm py-2 px-3"
            onClick={() => onItemClick(query)}
          >
            {query}
          </Badge>
        ))}
      </div>
    </div>
  );
}
