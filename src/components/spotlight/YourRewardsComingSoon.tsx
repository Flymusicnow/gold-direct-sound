import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, Sparkles } from "lucide-react";

export default function YourRewardsComingSoon() {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Gift className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Your Rewards</h2>
      </div>

      <Card className="border-dashed border-2 border-muted bg-muted/30">
        <CardContent className="flex flex-col items-center justify-center py-8 px-6 text-center">
          <div className="rounded-full bg-primary/10 p-4 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          
          <h3 className="text-lg font-medium mb-2">
            Rewards are coming soon!
          </h3>
          
          <p className="text-muted-foreground text-sm max-w-xs mb-4">
            Keep voting in Spotlight to build your history. When rewards launch, your participation will count.
          </p>
          
          <Badge variant="secondary" className="text-xs">
            Coming Soon
          </Badge>
        </CardContent>
      </Card>
    </section>
  );
}
