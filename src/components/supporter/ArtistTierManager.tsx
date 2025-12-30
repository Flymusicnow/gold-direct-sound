import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, GripVertical, Loader2, Check, CheckCircle2, AlertTriangle, Wrench } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Tier {
  id: string;
  name: string;
  slug: string;
  price_cents: number;
  currency: string;
  description: string | null;
  features: string[];
  sort_order: number;
  is_active: boolean;
  stripe_price_id: string | null;
  stripe_product_id: string | null;
}

type StripeStatus = 'configured' | 'missing' | 'checking';

export function ArtistTierManager() {
  const { user } = useAuth();
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [artistId, setArtistId] = useState<string | null>(null);
  const [editingTier, setEditingTier] = useState<Tier | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fixingTierId, setFixingTierId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    price: '',
    description: '',
    features: '',
    is_active: true,
  });

  useEffect(() => {
    if (user) {
      fetchArtistAndTiers();
    }
  }, [user]);

  const fetchArtistAndTiers = async () => {
    try {
      setLoading(true);

      // Get artist profile
      const { data: artist } = await supabase
        .from('artist_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!artist) {
        setLoading(false);
        return;
      }

      setArtistId(artist.id);

      // Fetch tiers including stripe fields
      const { data: tiersData, error } = await supabase
        .from('supporter_tiers')
        .select('*')
        .eq('artist_id', artist.id)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      setTiers(tiersData?.map(t => ({
        ...t,
        features: Array.isArray(t.features) 
          ? (t.features as unknown[]).map(f => String(f))
          : [],
        stripe_price_id: t.stripe_price_id || null,
        stripe_product_id: t.stripe_product_id || null,
      })) || []);
    } catch (err) {
      console.error('Error fetching tiers:', err);
      toast.error('Failed to load tiers');
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingTier(null);
    setFormData({
      name: '',
      slug: '',
      price: '',
      description: '',
      features: '',
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (tier: Tier) => {
    setEditingTier(tier);
    setFormData({
      name: tier.name,
      slug: tier.slug,
      price: (tier.price_cents / 100).toString(),
      description: tier.description || '',
      features: tier.features.join('\n'),
      is_active: tier.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!artistId) return;

    try {
      setSaving(true);

      const features = formData.features.split('\n').filter(f => f.trim());

      // Call edge function to create tier with Stripe product/price
      const { data, error } = await supabase.functions.invoke('create-supporter-tier-price', {
        body: {
          tier_id: editingTier?.id || undefined,
          name: formData.name,
          price_cents: Math.round(parseFloat(formData.price) * 100),
          currency: 'SEK',
          description: formData.description || null,
          features,
          is_active: formData.is_active,
          sort_order: editingTier ? editingTier.sort_order : tiers.length,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(editingTier ? 'Tier updated' : 'Tier created');
      setIsDialogOpen(false);
      fetchArtistAndTiers();
    } catch (err) {
      console.error('Error saving tier:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to save tier');
    } finally {
      setSaving(false);
    }
  };

  const handleFixStripe = async (tier: Tier) => {
    setFixingTierId(tier.id);
    try {
      // Re-save the tier through the edge function to create Stripe objects
      const { data, error } = await supabase.functions.invoke('create-supporter-tier-price', {
        body: {
          tier_id: tier.id,
          name: tier.name,
          price_cents: tier.price_cents,
          currency: tier.currency,
          description: tier.description,
          features: tier.features,
          is_active: tier.is_active,
          sort_order: tier.sort_order,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Stripe configuration fixed');
      fetchArtistAndTiers();
    } catch (err) {
      console.error('Error fixing Stripe:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to fix Stripe configuration');
    } finally {
      setFixingTierId(null);
    }
  };

  const handleDelete = async (tierId: string) => {
    if (!confirm('Are you sure you want to delete this tier?')) return;

    try {
      const { error } = await supabase
        .from('supporter_tiers')
        .delete()
        .eq('id', tierId);

      if (error) throw error;
      
      toast.success('Tier deleted');
      fetchArtistAndTiers();
    } catch (err) {
      console.error('Error deleting tier:', err);
      toast.error('Failed to delete tier');
    }
  };

  const getStripeStatus = (tier: Tier): StripeStatus => {
    if (tier.stripe_price_id) return 'configured';
    return 'missing';
  };

  const renderStripeStatusBadge = (tier: Tier) => {
    const status = getStripeStatus(tier);
    
    if (status === 'configured') {
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Payments ready
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Missing price
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Supporter Tiers</CardTitle>
              <CardDescription>
                Create custom tiers for your supporters
              </CardDescription>
            </div>
            <Button onClick={openCreateDialog} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Tier
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {tiers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No custom tiers yet.</p>
              <p className="text-sm">Default tiers will be shown to fans.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tiers.map((tier) => (
                <div
                  key={tier.id}
                  className="flex items-center gap-4 p-4 rounded-lg border bg-card"
                >
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium truncate">{tier.name}</h4>
                      {!tier.is_active && (
                        <span className="text-xs text-muted-foreground">(Inactive)</span>
                      )}
                      {renderStripeStatusBadge(tier)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {(tier.price_cents / 100).toFixed(0)} {tier.currency}/month
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStripeStatus(tier) === 'missing' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFixStripe(tier)}
                        disabled={fixingTierId === tier.id}
                        className="text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/10"
                      >
                        {fixingTierId === tier.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Wrench className="h-3 w-3" />
                        )}
                        <span className="ml-1">Fix</span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(tier)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(tier.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTier ? 'Edit Tier' : 'Create Tier'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Gold Supporter"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (SEK/month)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="99"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What supporters get..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">Features (one per line)</Label>
              <Textarea
                id="features"
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                placeholder="Early access to releases&#10;Exclusive content&#10;Monthly XP bonus"
                rows={4}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Active</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.name || !formData.price}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              {editingTier ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
