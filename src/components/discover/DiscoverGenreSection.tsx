import { useGenres } from '@/hooks/useGenreContent';
import { DiscoverGenreRail } from './DiscoverGenreRail';
import { Music2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function DiscoverGenreSection() {
  const { genres, loading } = useGenres();

  if (loading) {
    return (
      <div className="space-y-8">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Music2 className="w-6 h-6 text-primary" />
          Genres & Vibes
        </h2>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-8 w-32" />
            <div className="flex gap-4 overflow-x-auto pb-4">
              {[...Array(5)].map((_, j) => (
                <Skeleton key={j} className="w-44 h-56 rounded-xl flex-shrink-0" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (genres.length === 0) return null;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Music2 className="w-6 h-6 text-primary" />
        Genres & Vibes
      </h2>

      {genres.map((genre) => (
        <DiscoverGenreRail key={genre} genre={genre} />
      ))}
    </div>
  );
}
