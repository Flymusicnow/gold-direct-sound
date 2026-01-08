import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { BottomNavBarAdmin } from '@/components/mobile/BottomNavBarAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Search, Percent, Crown, Users, Filter } from 'lucide-react';
import { usePricingOverrideStats, useAllPricingOverrides } from '@/hooks/useArtistPricingOverride';
import { ArtistPricingOverrideForm } from '@/components/admin/ArtistPricingOverrideForm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

interface ArtistWithOverride {
  id: string;
  artist_name: string;
  avatar_url: string | null;
  user_id: string;
  override?: {
    id: string;
    status: 'beta_free' | 'discounted' | 'standard';
    discount_percent: number | null;
    expires_at: string | null;
    reason: string;
  } | null;
}

export default function AdminArtistPricing() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedArtist, setSelectedArtist] = useState<ArtistWithOverride | null>(null);

  const { data: stats, isLoading: isLoadingStats } = usePricingOverrideStats();
  const { data: overrides } = useAllPricingOverrides();

  // Fetch all artists with their overrides
  const { data: artists, isLoading: isLoadingArtists } = useQuery({
    queryKey: ['artists-with-pricing', searchQuery, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('artist_profiles')
        .select(`
          id,
          artist_name,
          avatar_url,
          user_id
        `)
        .order('artist_name');

      if (searchQuery) {
        query = query.ilike('artist_name', `%${searchQuery}%`);
      }

      const { data: artistData, error } = await query.limit(50);
      if (error) throw error;

      // Merge with overrides
      const artistsWithOverrides = artistData?.map((artist) => {
        const override = overrides?.find((o: any) => o.artist_id === artist.id);
        return {
          ...artist,
          override: override ? {
            id: override.id,
            status: override.status,
            discount_percent: override.discount_percent,
            expires_at: override.expires_at,
            reason: override.reason,
          } : null,
        };
      }) || [];

      // Filter by status
      if (statusFilter !== 'all') {
        return artistsWithOverrides.filter((a) => {
          if (statusFilter === 'standard') return !a.override;
          return a.override?.status === statusFilter;
        });
      }

      return artistsWithOverrides;
    },
    enabled: true,
  });

  const getStatusBadge = (override?: ArtistWithOverride['override']) => {
    if (!override || override.status === 'standard') {
      return <Badge variant="secondary">Standard</Badge>;
    }
    if (override.status === 'beta_free') {
      return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Beta Free</Badge>;
    }
    return (
      <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
        {override.discount_percent}% Off
      </Badge>
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden md:block">
        <AdminSidebar />
      </div>

      <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold">Beta Artist Pricing</h1>
            <p className="text-muted-foreground">
              Control discounts and fee waivers for beta artists
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Crown className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.beta_free ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Beta Free</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <Percent className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.discounted ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Discounted</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.standard ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Standard</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.total ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Total Artists</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Artist List */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Artists</CardTitle>
                <CardDescription>Search and manage artist pricing overrides</CardDescription>
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search artists..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Artists</SelectItem>
                      <SelectItem value="beta_free">Beta Free</SelectItem>
                      <SelectItem value="discounted">Discounted</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingArtists ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {artists?.map((artist) => (
                      <button
                        key={artist.id}
                        onClick={() => setSelectedArtist(artist)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-muted/50 text-left ${
                          selectedArtist?.id === artist.id ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={artist.avatar_url || undefined} />
                          <AvatarFallback>{artist.artist_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{artist.artist_name}</p>
                          {artist.override?.expires_at && (
                            <p className="text-xs text-muted-foreground">
                              Expires {format(new Date(artist.override.expires_at), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                        {getStatusBadge(artist.override)}
                      </button>
                    ))}
                    {artists?.length === 0 && (
                      <p className="text-center py-8 text-muted-foreground">No artists found</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Override Form */}
            <div>
              {selectedArtist ? (
                <ArtistPricingOverrideForm
                  artistId={selectedArtist.id}
                  artistName={selectedArtist.artist_name}
                  onClose={() => setSelectedArtist(null)}
                />
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Percent className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select an artist to manage their pricing</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <BottomNavBarAdmin />
    </div>
  );
}
