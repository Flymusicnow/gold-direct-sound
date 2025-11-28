import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface EmptyStateCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaText: string;
  ctaPath?: string;
  onCtaClick?: () => void;
  variant?: "default" | "gold";
  className?: string;
}

export function EmptyStateCard({
  icon: Icon,
  title,
  description,
  ctaText,
  ctaPath,
  onCtaClick,
  variant = "default",
  className,
}: EmptyStateCardProps) {
  const content = (
    <Card className={cn(
      "p-12 text-center border-dashed transition-all hover:border-primary/50",
      variant === "gold" && "border-primary/30 bg-primary/5",
      className
    )}>
      <div className="flex flex-col items-center gap-4">
        <div className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center",
          variant === "gold" 
            ? "bg-gradient-to-br from-primary to-primary/70" 
            : "bg-muted"
        )}>
          <Icon className={cn(
            "h-8 w-8",
            variant === "gold" ? "text-primary-foreground" : "text-muted-foreground"
          )} />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {description}
          </p>
        </div>

        {ctaPath ? (
          <Button
            asChild
            className={cn(
              variant === "gold" && "bg-gradient-gold hover:opacity-90"
            )}
          >
            <Link to={ctaPath}>
              {ctaText}
            </Link>
          </Button>
        ) : (
          <Button
            onClick={onCtaClick}
            className={cn(
              variant === "gold" && "bg-gradient-gold hover:opacity-90"
            )}
          >
            {ctaText}
          </Button>
        )}
      </div>
    </Card>
  );

  return content;
}