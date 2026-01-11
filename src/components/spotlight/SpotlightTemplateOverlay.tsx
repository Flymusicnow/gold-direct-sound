import { ExternalLink, MapPin, Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SpotlightTemplateOverlayProps {
  templateData: Record<string, unknown>;
  templateName?: string;
  layoutConfig?: { overlay?: string; vibe?: string };
  onCtaClick?: () => void;
}

export function SpotlightTemplateOverlay({
  templateData,
  templateName,
  layoutConfig,
  onCtaClick,
}: SpotlightTemplateOverlayProps) {
  if (!templateData || Object.keys(templateData).length === 0) return null;
  
  const overlay = layoutConfig?.overlay || 'bottom';
  const vibe = layoutConfig?.vibe || 'default';
  
  // Get common fields
  const title = templateData.title as string || templateData.eventName as string || templateData.productName as string;
  const message = templateData.message as string || templateData.description as string || templateData.caption as string || templateData.emotionalText as string;
  const cta = templateData.cta as string;
  const date = templateData.date as string;
  const location = templateData.location as string;
  const price = templateData.price as string;

  if (overlay === 'none') return null;

  // Bottom overlay (most common - New Release, Merch, BTS, Moment)
  if (overlay === 'bottom') {
    return (
      <div className="absolute bottom-0 left-0 right-0 p-4">
        {/* Gradient backdrop */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />
        
        {/* Content */}
        <div className="relative z-10 space-y-2">
          {title && (
            <h3 className={cn(
              "font-bold text-white",
              vibe === 'casual' ? "text-lg" : "text-xl"
            )}>
              {title}
            </h3>
          )}
          
          {message && (
            <p className={cn(
              "text-white/90 line-clamp-2",
              vibe === 'casual' ? "text-sm" : "text-base"
            )}>
              {message}
            </p>
          )}

          {price && (
            <p className="text-primary font-semibold text-lg">{price}</p>
          )}

          {cta && (
            <Button 
              size="sm" 
              className="mt-2 gap-1"
              onClick={onCtaClick}
            >
              {cta}
              <ArrowRight className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Full overlay (Tour/Shows)
  if (overlay === 'full') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
        
        {/* Content */}
        <div className="relative z-10 space-y-4">
          {title && (
            <h2 className="text-2xl font-bold text-white uppercase tracking-wide">
              {title}
            </h2>
          )}
          
          <div className="space-y-2">
            {location && (
              <p className="text-white/90 flex items-center justify-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                {location}
              </p>
            )}
            
            {date && (
              <p className="text-white/90 flex items-center justify-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                {date}
              </p>
            )}
          </div>

          {cta && (
            <Button 
              className="mt-4 gap-1"
              onClick={onCtaClick}
            >
              {cta}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Center overlay (Announcements)
  if (overlay === 'center') {
    return (
      <div className="absolute inset-0 flex items-center justify-center p-6">
        {/* Blurred card */}
        <div className="relative bg-background/80 backdrop-blur-md rounded-xl p-6 max-w-[280px] text-center shadow-2xl">
          {title && (
            <h3 className="text-xl font-bold mb-2">{title}</h3>
          )}
          
          {message && (
            <p className="text-muted-foreground text-sm mb-4">{message}</p>
          )}

          {cta && (
            <Button 
              size="sm" 
              className="gap-1"
              onClick={onCtaClick}
            >
              {cta}
              <ArrowRight className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
