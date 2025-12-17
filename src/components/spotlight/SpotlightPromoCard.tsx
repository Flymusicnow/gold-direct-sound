import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Trophy } from "lucide-react";

interface ActiveCampaign {
  id: string;
  name: string;
  description: string | null;
  end_date: string;
}

export default function SpotlightPromoCard() {
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<ActiveCampaign | null>(null);

  useEffect(() => {
    fetchActiveCampaign();
  }, []);

  const fetchActiveCampaign = async () => {
    try {
      const { data, error } = await supabase
        .from('spotlight_campaigns')
        .select('id, name, description, end_date')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setCampaign(data);
    } catch (error) {
      console.error('Error fetching active campaign:', error);
    }
  };

  // Show placeholder when no active campaign
  if (!campaign) {
    return (
      <Card className="bg-gradient-to-br from-muted/30 via-background to-background border-border">
        <CardContent className="py-8 text-center">
          <Trophy className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground font-medium mb-1">Voting opens soon</p>
          <p className="text-xs text-muted-foreground/70">
            Check back for the next Spotlight campaign
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary/20 via-background to-background border-primary/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle className="text-primary">FlyMusic Spotlight is Live!</CardTitle>
        </div>
        <CardDescription className="text-foreground/80">{campaign.name}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {campaign.description || "Vote for your favorite tracks and support independent artists"}
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          Ends: {new Date(campaign.end_date).toLocaleDateString()}
        </p>
        <Button
          onClick={() => navigate(`/spotlight/${campaign.id}`)}
          className="w-full bg-gradient-gold"
        >
          Vote Now
        </Button>
      </CardContent>
    </Card>
  );
}