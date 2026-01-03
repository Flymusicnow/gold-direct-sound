import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Crown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SupporterTier {
  id: string;
  name: string;
  slug: string;
  price_cents: number;
  description: string | null;
  features: string[];
  is_active: boolean;
}

interface Artist {
  id: string;
  artist_name: string;
  avatar_url: string | null;
}

const TIER_COLORS: Record<string, string> = {
  bronze: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
  silver: 'bg-gray-400/20 text-gray-400 border-gray-400/30',
  gold: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  diamond: 'bg-cyan-400/20 text-cyan-400 border-cyan-400/30'
};

const SubscribePage: React.FC = () => {
  const { artistId } = useParams<{ artistId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [tiers, setTiers] = useState<SupporterTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [subscribingTier, setSubscribingTier] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!artistId) return;

      try {
        // Fetch artist
        const { data: artistData } = await supabase
          .from('artist_profiles')
          .select('id, artist_name, avatar_url')
          .eq('id', artistId)
          .single();

        setArtist(artistData);

        // Fetch tiers
        const { data: tiersData } = await supabase
          .from('supporter_tiers')
          .select('*')
          .eq('artist_id', artistId)
          .eq('is_active', true)
          .order('price_cents', { ascending: true });

        // Transform features from Json to string[]
        const transformedTiers: SupporterTier[] = (tiersData || []).map(tier => ({
          ...tier,
          features: Array.isArray(tier.features) 
            ? tier.features.map(String)
            : []
        }));

        setTiers(transformedTiers);
      } catch (error) {
        console.error('Error fetching subscription data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [artistId]);

  const handleSubscribe = async (tier: SupporterTier) => {
    if (!user) {
      toast.error('Please sign in to subscribe');
      navigate('/signin/fan');
      return;
    }

    if (!artistId) return;

    setSubscribingTier(tier.id);

    try {
      const { data, error } = await supabase.functions.invoke('create-supporter-checkout', {
        body: {
          artist_id: artistId,
          tier_slug: tier.slug,
          return_url: `${window.location.origin}/artist/${artistId}/community`
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setSubscribingTier(null);
    }
  };

  const handleBack = () => {
    if (artistId) {
      navigate(`/artist/${artistId}/community`);
    } else {
      navigate(-1);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Artist not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-6">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="gap-2 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {/* Artist header */}
        <div className="text-center mb-8">
          <Avatar className="h-20 w-20 mx-auto mb-4">
            <AvatarImage src={artist.avatar_url || undefined} />
            <AvatarFallback className="text-2xl">
              {artist.artist_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-bold mb-2">Join {artist.artist_name}'s Community</h1>
          <p className="text-muted-foreground">
            Choose a tier to unlock exclusive content and perks
          </p>
        </div>

        {/* Tier cards */}
        {tiers.length === 0 ? (
          <div className="text-center py-12">
            <Crown className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              No subscription tiers available yet
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tiers.map(tier => (
              <Card 
                key={tier.id} 
                className="relative overflow-hidden border-border/50 hover:border-primary/50 transition-colors"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge 
                      variant="outline" 
                      className={`capitalize ${TIER_COLORS[tier.slug] || ''}`}
                    >
                      {tier.name}
                    </Badge>
                  </div>
                  <CardTitle className="text-3xl font-bold">
                    {(tier.price_cents / 100).toFixed(0)} SEK
                    <span className="text-sm font-normal text-muted-foreground">/month</span>
                  </CardTitle>
                  {tier.description && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {tier.description}
                    </p>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {tier.features.length > 0 && (
                    <ul className="space-y-2">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  
                  <Button
                    onClick={() => handleSubscribe(tier)}
                    disabled={subscribingTier !== null}
                    className="w-full"
                  >
                    {subscribingTier === tier.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Crown className="h-4 w-4 mr-2" />
                        Subscribe
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscribePage;
