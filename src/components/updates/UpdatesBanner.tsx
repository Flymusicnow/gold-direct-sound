import { useState } from "react";
import { X, ExternalLink, AlertTriangle, Info, Megaphone, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlatformUpdates, PlatformUpdate } from "@/hooks/usePlatformUpdates";
import { cn } from "@/lib/utils";

const priorityStyles = {
  critical: {
    bg: "bg-destructive/10 border-destructive/30",
    icon: AlertTriangle,
    iconColor: "text-destructive"
  },
  high: {
    bg: "bg-orange-500/10 border-orange-500/30",
    icon: AlertCircle,
    iconColor: "text-orange-500"
  },
  normal: {
    bg: "bg-primary/10 border-primary/30",
    icon: Megaphone,
    iconColor: "text-primary"
  },
  low: {
    bg: "bg-muted border-border",
    icon: Info,
    iconColor: "text-muted-foreground"
  }
};

export function UpdatesBanner() {
  const { visibleUpdates, loading, dismissUpdate } = usePlatformUpdates();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading || visibleUpdates.length === 0) return null;

  // Show only the highest priority update
  const topUpdate = visibleUpdates[0];
  const style = priorityStyles[topUpdate.priority as keyof typeof priorityStyles] || priorityStyles.normal;
  const Icon = style.icon;

  return (
    <div className={cn(
      "relative border rounded-lg p-4 mb-4",
      style.bg
    )}>
      <div className="flex items-start gap-3">
        <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", style.iconColor)} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm">{topUpdate.title}</h4>
            {topUpdate.priority === 'critical' && (
              <span className="text-xs bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded">
                CRITICAL
              </span>
            )}
          </div>
          
          <p className={cn(
            "text-sm text-muted-foreground mt-1",
            expandedId !== topUpdate.id && "line-clamp-2"
          )}>
            {topUpdate.content}
          </p>
          
          {topUpdate.content.length > 100 && (
            <button
              onClick={() => setExpandedId(expandedId === topUpdate.id ? null : topUpdate.id)}
              className="text-xs text-primary hover:underline mt-1"
            >
              {expandedId === topUpdate.id ? 'Show less' : 'Read more'}
            </button>
          )}
          
          {topUpdate.link_url && (
            <a
              href={topUpdate.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
            >
              {topUpdate.link_text || 'Learn more'}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0"
          onClick={() => dismissUpdate(topUpdate.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {visibleUpdates.length > 1 && (
        <p className="text-xs text-muted-foreground mt-2 pl-8">
          +{visibleUpdates.length - 1} more update{visibleUpdates.length > 2 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
