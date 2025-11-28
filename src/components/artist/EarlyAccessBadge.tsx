import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface EarlyAccessBadgeProps {
  className?: string;
}

export function EarlyAccessBadge({ className }: EarlyAccessBadgeProps) {
  return (
    <Badge 
      className={`bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/50 hover:border-primary transition-colors ${className}`}
    >
      <Sparkles className="h-3 w-3 mr-1 text-primary" />
      <span className="text-primary font-medium">Early Access Tester</span>
    </Badge>
  );
}