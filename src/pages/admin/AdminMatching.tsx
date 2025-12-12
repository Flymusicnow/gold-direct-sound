import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Target, Users, Building2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface CollabEntity {
  id: string;
  name: string;
  type: string;
}

interface MatchedArtist {
  artist_id: string;
  artist_name: string;
  avatar_url: string | null;
  genre: string | null;
  city: string | null;
  country: string | null;
  total_score: number;
  genre_score: number;
  location_score: number;
  xp_score: number;
  supporters_score: number;
  collab_type_score: number;
}

export default function AdminMatching() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [entities, setEntities] = useState<CollabEntity[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [matchedArtists, setMatchedArtists] = useState<MatchedArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (profile?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchEntities();
  }, [user, profile, navigate]);

  const fetchEntities = async () => {
    try {
      const { data, error } = await supabase
        .from('collab_entities')
        .select('id, name, type')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setEntities(data || []);
    } catch (error) {
      console.error('Error fetching entities:', error);
      toast.error('Failed to load entities');
    } finally {
      setLoading(false);
    }
  };

  const runMatching = async () => {
    if (!selectedEntityId) {
      toast.error('Please select an entity first');
      return;
    }

    setMatching(true);
    try {
      const { data, error } = await supabase
        .rpc('get_top_artists_for_entity', {
          _collab_entity_id: selectedEntityId,
          _limit: 20,
        });

      if (error) throw error;
      setMatchedArtists(data || []);
      
      if (data?.length === 0) {
        toast.info('No matching artists found');
      } else {
        toast.success(`Found ${data?.length} matching artists`);
      }
    } catch (error) {
      console.error('Error running matching:', error);
      toast.error('Failed to run matching algorithm');
    } finally {
      setMatching(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-muted-foreground';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 70) return <Badge className="bg-green-500/20 text-green-500">High Match</Badge>;
    if (score >= 40) return <Badge className="bg-yellow-500/20 text-yellow-500">Medium Match</Badge>;
    return <Badge variant="secondary">Low Match</Badge>;
  };

  if (loading) {
    return (
      <AdminLayout title="Matching Engine" description="Test artist-to-partner matching algorithm">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Matching Engine" description="Test artist-to-partner matching algorithm">
      {/* Entity Selector */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Select Partner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedEntityId} onValueChange={setSelectedEntityId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Choose a brand, festival or sponsor..." />
              </SelectTrigger>
              <SelectContent>
                {entities.map((entity) => (
                  <SelectItem key={entity.id} value={entity.id}>
                    <span className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {entity.name}
                      <Badge variant="outline" className="ml-2 text-xs capitalize">
                        {entity.type.replace('_', ' ')}
                      </Badge>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={runMatching} disabled={!selectedEntityId || matching} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${matching ? 'animate-spin' : ''}`} />
              {matching ? 'Matching...' : 'Run Matching'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {matchedArtists.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Top Matching Artists
              <Badge variant="secondary" className="ml-2">{matchedArtists.length} results</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Artist</TableHead>
                    <TableHead>Genre</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Genre</TableHead>
                    <TableHead className="text-center">Location</TableHead>
                    <TableHead className="text-center">XP</TableHead>
                    <TableHead className="text-center">Supporters</TableHead>
                    <TableHead className="text-center">Collab</TableHead>
                    <TableHead>Match</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matchedArtists.map((artist, index) => (
                    <TableRow key={artist.artist_id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-muted overflow-hidden">
                            {artist.avatar_url ? (
                              <img src={artist.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                                {artist.artist_name?.[0]}
                              </div>
                            )}
                          </div>
                          <span className="font-medium">{artist.artist_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {artist.genre && (
                          <Badge variant="outline" className="text-xs">{artist.genre}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {[artist.city, artist.country].filter(Boolean).join(', ') || '-'}
                      </TableCell>
                      <TableCell className={`text-center font-bold ${getScoreColor(artist.total_score)}`}>
                        {artist.total_score}
                      </TableCell>
                      <TableCell className="text-center text-sm">{artist.genre_score}</TableCell>
                      <TableCell className="text-center text-sm">{artist.location_score}</TableCell>
                      <TableCell className="text-center text-sm">{artist.xp_score}</TableCell>
                      <TableCell className="text-center text-sm">{artist.supporters_score}</TableCell>
                      <TableCell className="text-center text-sm">{artist.collab_type_score}</TableCell>
                      <TableCell>{getScoreBadge(artist.total_score)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!selectedEntityId && entities.length > 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Select a Partner to Start</h3>
            <p className="text-muted-foreground">
              Choose a brand, festival or sponsor from the dropdown to see matching artists
            </p>
          </CardContent>
        </Card>
      )}

      {entities.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Partners Available</h3>
            <p className="text-muted-foreground mb-4">
              Create collab entities first to test the matching engine
            </p>
            <Button onClick={() => navigate('/admin/collab-entities/new')}>
              Create Entity
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Score Legend */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-sm">Score Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <p className="font-medium text-primary">Genre/Style</p>
              <p className="text-muted-foreground">Max 40 pts</p>
            </div>
            <div>
              <p className="font-medium text-primary">Location</p>
              <p className="text-muted-foreground">Max 15 pts</p>
            </div>
            <div>
              <p className="font-medium text-primary">XP Level</p>
              <p className="text-muted-foreground">Max 15 pts</p>
            </div>
            <div>
              <p className="font-medium text-primary">Supporters</p>
              <p className="text-muted-foreground">Max 15 pts</p>
            </div>
            <div>
              <p className="font-medium text-primary">Collab Type</p>
              <p className="text-muted-foreground">Max 15 pts</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}