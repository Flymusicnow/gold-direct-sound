import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search as SearchIcon, MapPin } from "lucide-react";
import { toast } from "sonner";

interface Artist {
  id: string;
  user_id: string;
  artist_name: string;
  avatar_url: string | null;
  genre: string | null;
  city: string | null;
  country: string | null;
  bio: string | null;
}

export default function Search() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuery(q);
      performSearch(q);
    }
  }, [searchParams]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      const trimmedQuery = searchQuery.trim();

      const { data, error } = await supabase
        .from("artist_profiles")
        .select("*")
        .eq("status", "approved")
        .or(
          `artist_name.ilike.%${trimmedQuery}%,genre.ilike.%${trimmedQuery}%,city.ilike.%${trimmedQuery}%,country.ilike.%${trimmedQuery}%`
        )
        .limit(50);

      if (error) throw error;

      setResults(data || []);
    } catch (error) {
      console.error("Error searching artists:", error);
      toast.error("Failed to search");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
    }
  };

  return (
    <div className="min-h-screen py-24 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-6 flex items-center gap-3">
            <SearchIcon className="h-10 w-10 text-primary" />
            Search Artists
          </h1>

          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              type="text"
              placeholder="Search by name, genre, or location..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
              maxLength={100}
            />
            <Button type="submit" disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </Button>
          </form>
        </div>

        {/* Results */}
        {query && !loading && (
          <p className="text-muted-foreground mb-6">
            {results.length} {results.length === 1 ? "result" : "results"} for "
            {query}"
          </p>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Searching...</p>
          </div>
        ) : results.length === 0 && query ? (
          <div className="text-center py-12">
            <SearchIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No artists found for "{query}"
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Try searching for a different name, genre, or location
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {results.map((artist) => (
              <Card
                key={artist.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/artist/${artist.user_id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {artist.avatar_url ? (
                      <img
                        src={artist.avatar_url}
                        alt={artist.artist_name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-2xl text-primary font-bold">
                          {artist.artist_name[0]}
                        </span>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-1 truncate">
                        {artist.artist_name}
                      </h3>

                      {artist.genre && (
                        <Badge
                          variant="secondary"
                          className="mb-2 text-xs bg-primary/10 text-primary"
                        >
                          {artist.genre}
                        </Badge>
                      )}

                      {(artist.city || artist.country) && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>
                            {[artist.city, artist.country]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        </div>
                      )}

                      {artist.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                          {artist.bio}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
