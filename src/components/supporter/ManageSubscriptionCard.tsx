import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Star, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Subscription {
  id: string;
  tier: string;
  status: string;
  current_period_end: string;
  total_paid: number;
  artist: {
    id: string;
    artist_name: string;
    avatar_url: string;
  };
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
              artist_name,
              avatar_url
            )
          `)
          .eq('fan_user_id', user.id)
          .eq('status', 'active');

        if (error) throw error;
        setSubscriptions(data || []);
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
                  {sub.tier === 'gold' ? (
                    <Crown className="h-4 w-4 text-primary" />
                  ) : (
                    <Star className="h-4 w-4 text-primary" />
                  )}
                  <Badge variant={sub.tier === 'gold' ? 'default' : 'secondary'}>
                    {sub.tier === 'gold' ? 'Gold' : 'Basic'} Supporter
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Renews {new Date(sub.current_period_end).toLocaleDateString()}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // This would typically open Stripe Customer Portal
                window.open(`/artist/${sub.artist.id}`, '_blank');
              }}
            >
              View Artist <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ))}

        <div className="pt-4 border-t border-border">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Total monthly support:</span>
            <span className="font-semibold">
              {subscriptions.reduce((sum, sub) => {
                const amount = sub.tier === 'gold' ? 99 : 49;
                return sum + amount;
              }, 0)} kr
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
