import { Card } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import SupporterBadge from "./SupporterBadge";

interface TopSupporter {
  fan_user_id: string;
  score: number;
  level: 'none' | 'bronze' | 'silver' | 'gold';
  profiles: {
    full_name: string | null;
    email: string;
  };
}

interface TopSupportersCardProps {
  supporters: TopSupporter[];
}

export default function TopSupportersCard({ supporters }: TopSupportersCardProps) {
  if (supporters.length === 0) return null;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-semibold">Top Supporters</h2>
      </div>

      <div className="space-y-4">
        {supporters.map((supporter, index) => (
          <div
            key={supporter.fan_user_id}
            className="flex items-center gap-4 p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
              #{index + 1}
            </div>
            
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary">
                {(supporter.profiles.full_name || supporter.profiles.email)[0].toUpperCase()}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">
                {supporter.profiles.full_name || supporter.profiles.email.split('@')[0]}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <SupporterBadge level={supporter.level} variant="mini" />
                <span className="text-xs text-muted-foreground">
                  {supporter.score} points
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
