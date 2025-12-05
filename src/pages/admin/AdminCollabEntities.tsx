import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Building2, Music, Megaphone, Calendar, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { BottomNavBarAdmin } from '@/components/mobile/BottomNavBarAdmin';
import { useIsMobile } from '@/hooks/use-mobile';

interface CollabEntity {
  id: string;
  type: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  brand: <Megaphone className="h-4 w-4" />,
  festival: <Music className="h-4 w-4" />,
  sponsor: <Building2 className="h-4 w-4" />,
  event_agency: <Calendar className="h-4 w-4" />,
};

const typeLabels: Record<string, string> = {
  brand: 'Brand',
  festival: 'Festival',
  sponsor: 'Sponsor',
  event_agency: 'Event Agency',
};

export default function AdminCollabEntities() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [entities, setEntities] = useState<CollabEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

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
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntities(data || []);
    } catch (error) {
      console.error('Error fetching entities:', error);
      toast.error('Failed to load collab entities');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entity?')) return;
    
    try {
      const { error } = await supabase
        .from('collab_entities')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Entity deleted');
      fetchEntities();
    } catch (error) {
      console.error('Error deleting entity:', error);
      toast.error('Failed to delete entity');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('collab_entities')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(currentStatus ? 'Entity deactivated' : 'Entity activated');
      fetchEntities();
    } catch (error) {
      console.error('Error updating entity:', error);
      toast.error('Failed to update entity');
    }
  };

  const filteredEntities = entities.filter(entity => {
    const matchesSearch = entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entity.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || entity.type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Collab Entities</h1>
            <p className="text-sm text-muted-foreground">Manage brands, festivals, sponsors & agencies</p>
          </div>
          <Button onClick={() => navigate('/admin/collab-entities/new')} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Entity
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search entities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="brand">Brands</SelectItem>
              <SelectItem value="festival">Festivals</SelectItem>
              <SelectItem value="sponsor">Sponsors</SelectItem>
              <SelectItem value="event_agency">Event Agencies</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{entities.length}</p>
              <p className="text-xs text-muted-foreground">Total Entities</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-500">{entities.filter(e => e.is_active).length}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{entities.filter(e => e.type === 'festival').length}</p>
              <p className="text-xs text-muted-foreground">Festivals</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{entities.filter(e => e.type === 'brand').length}</p>
              <p className="text-xs text-muted-foreground">Brands</p>
            </CardContent>
          </Card>
        </div>

        {/* Entity List */}
        {filteredEntities.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No entities found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || typeFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Create your first collab entity to get started'}
              </p>
              {!searchQuery && typeFilter === 'all' && (
                <Button onClick={() => navigate('/admin/collab-entities/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entity
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredEntities.map((entity) => (
              <Card key={entity.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Logo */}
                    <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                      {entity.logo_url ? (
                        <img src={entity.logo_url} alt={entity.name} className="w-full h-full object-cover" />
                      ) : (
                        typeIcons[entity.type] || <Building2 className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">{entity.name}</h3>
                        <Badge variant={entity.is_active ? 'default' : 'secondary'} className="text-xs">
                          {entity.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs gap-1">
                          {typeIcons[entity.type]}
                          {typeLabels[entity.type]}
                        </Badge>
                        <span className="truncate">/{entity.slug}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(entity.id, entity.is_active)}
                      >
                        {entity.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate(`/admin/collab-entities/${entity.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(entity.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {isMobile && <BottomNavBarAdmin />}
    </div>
  );
}
