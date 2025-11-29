import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ListMusic } from 'lucide-react';
import { SearchResultHighlight } from './SearchResultHighlight';
import type { SearchStack } from '@/hooks/useSearch';

interface SearchStackCardProps {
  stack: SearchStack;
  query: string;
}

export function SearchStackCard({ stack, query }: SearchStackCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      className="hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer group"
      onClick={() => navigate(`/fan/playlists/${stack.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Stack Icon */}
          <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
            <ListMusic className="h-8 w-8 text-primary" />
          </div>

          {/* Stack Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate mb-1">
              <SearchResultHighlight text={stack.name} query={query} />
            </h3>

            {stack.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {stack.description}
              </p>
            )}

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Public Stack
              </Badge>
              {stack.trackCount !== undefined && (
                <span className="text-xs text-muted-foreground">
                  {stack.trackCount} {stack.trackCount === 1 ? 'track' : 'tracks'}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
