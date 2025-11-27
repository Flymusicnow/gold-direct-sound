import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
}

export function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <Card className="p-6 bg-gradient-to-br from-card to-card/80 border-border/50 shadow-gold hover:shadow-lg transition-all duration-200">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shadow-gold">
          <Icon className="h-7 w-7 text-primary" />
        </div>
        <div>
          <p className="text-3xl font-bold">{value.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xs text-muted-foreground/70">All time</p>
        </div>
      </div>
    </Card>
  );
}
