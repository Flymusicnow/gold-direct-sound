import { useState } from "react";
import { ChevronDown, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface CollapsibleStatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  trend?: string;
  changePercent?: number;
  expandedContent?: React.ReactNode;
  defaultExpanded?: boolean;
}

export function CollapsibleStatCard({
  icon: Icon,
  label,
  value,
  trend,
  changePercent,
  expandedContent,
  defaultExpanded = false,
}: CollapsibleStatCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Card 
      className="overflow-hidden transition-all duration-200"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="p-4 cursor-pointer select-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{value}</p>
                {changePercent !== undefined && (
                  <span className={cn(
                    "text-xs font-medium",
                    changePercent > 0 ? "text-green-500" : changePercent < 0 ? "text-red-500" : "text-muted-foreground"
                  )}>
                    {changePercent > 0 ? "+" : ""}{changePercent}%
                  </span>
                )}
              </div>
            </div>
          </div>
          {expandedContent && (
            <ChevronDown 
              className={cn(
                "h-5 w-5 text-muted-foreground transition-transform duration-200 flex-shrink-0",
                isExpanded && "rotate-180"
              )} 
            />
          )}
        </div>
      </div>

      {expandedContent && (
        <div 
          className={cn(
            "border-t border-border/50 bg-muted/20 overflow-hidden transition-all duration-200",
            isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="p-4">
            {trend && (
              <p className="text-sm text-muted-foreground mb-3">{trend}</p>
            )}
            {expandedContent}
          </div>
        </div>
      )}
    </Card>
  );
}
