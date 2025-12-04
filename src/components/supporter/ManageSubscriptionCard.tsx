import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Star, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PaidSupporterBadge } from './PaidSupporterBadge';

interface Subscription {
  id: string;
  tier: string;
  tier_id: string | null;
  status: string;
  current_period_end: string;
  total_paid: number;
  artist: {
    id: string;
    user_id: string;
    artist_name: string;
    avatar_url: string;
  };
  tierInfo?: {
    name: string;
    price_cents: number;
  } | null;
}

export function ManageSubscriptionCard() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchSubscriptions = async () => {
      try {
        const { data, error } = await supabase
          .from('supporter_subscriptions')
          .select(`
            *,
            artist:artist_profiles!supporter_subscriptions_artist_id_fkey(
              id,
              user_id,
              artist_name,
              avatar_url
            )
          `)
          .eq('fan_user_id', user.id)
          .eq('status', 'active');

        if (error) throw error;
        
        // Fetch tier info for subscriptions with tier_id
        const tierIds = data?.filter(s => s.tier_id).map(s => s.tier_id) || [];
        let tierMap = new Map<string, { name: string; price_cents: number }>();
        
        if (tierIds.length > 0) {
          const { data: tiers } = await supabase
            .from('supporter_tiers')
            .select('id, name, price_cents')
            .in('id', tierIds);
          
          tiers?.forEach(t => tierMap.set(t.id, { name: t.name, price_cents: t.price_cents }));
        }

        const subsWithTiers = (data || []).map(sub => ({
          ...sub,
          tierInfo: sub.tier_id ? tierMap.get(sub.tier_id) : null
        }));

        setSubscriptions(subsWithTiers);
      } catch (error) {
        console.error('Error fetching subscriptions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You don't have any active subscriptions yet. Visit your favorite artists to become a supporter!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Subscriptions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscriptions.map((sub) => (
          <div
            key={sub.id}
            className="flex items-center justify-between p-4 border border-border rounded-lg"
          >
            <div className="flex items-center gap-4">
              <img
                src={sub.artist.avatar_url || '/placeholder.svg'}
                alt={sub.artist.artist_name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <h4 className="font-semibold">{sub.artist.artist_name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <PaidSupporterBadge 
                    tier={sub.tier as 'basic' | 'gold'} 
                    tierName={sub.tierInfo?.name}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Renews {new Date(sub.current_period_end).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const { data, error } = await supabase.functions.invoke('customer-portal');
                    if (error) throw error;
                    if (data?.url) window.open(data.url, '_blank');
                  } catch (error) {
                    console.error('Error opening portal:', error);
                  }
                }}
              >
                Manage
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  window.open(`/artist/${sub.artist.user_id}`, '_blank');
                }}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        <div className="pt-4 border-t border-border">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Total monthly support:</span>
            <span className="font-semibold">
              {subscriptions.reduce((sum, sub) => {
                const amount = sub.tierInfo?.price_cents 
                  ? sub.tierInfo.price_cents / 100 
                  : (sub.tier === 'gold' ? 99 : 49);
                return sum + amount;
              }, 0)} kr
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
