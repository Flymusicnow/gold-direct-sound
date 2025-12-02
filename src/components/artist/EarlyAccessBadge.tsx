import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface EarlyAccessBadgeProps {
  className?: string;
}

export function EarlyAccessBadge({ className }: EarlyAccessBadgeProps) {
  return (
    <Badge 
      className={`bg-primary text-primary-foreground hover:bg-primary/90 transition-colors ${className}`}
    >
      <Sparkles className="h-3 w-3 mr-1" />
      <span className="font-semibold">Early Access Tester</span>
    </Badge>
  );
}