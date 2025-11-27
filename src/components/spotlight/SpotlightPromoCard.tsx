import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

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

  if (!campaign) return null;

  return (
    <Card className="bg-gradient-to-br from-[#E8BF1A]/20 via-background to-background border-[#E8BF1A]/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#E8BF1A]" />
          <CardTitle className="text-[#E8BF1A]">FlyMusic Spotlight is Live!</CardTitle>
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
          className="w-full bg-gradient-to-r from-[#E8BF1A] to-[#B8960F]"
        >
          Vote Now
        </Button>
      </CardContent>
    </Card>
  );
}