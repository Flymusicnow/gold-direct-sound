import { Music, Calendar, ShoppingBag, Megaphone, Camera, Sparkles, Palette } from "lucide-react";
import { SpotlightTemplate } from "@/hooks/useSpotlightTemplates";
import { cn } from "@/lib/utils";

interface TemplateThumbnailProps {
  template: SpotlightTemplate;
}

const TEMPLATE_VISUALS: Record<string, {
  icon: React.ElementType;
  gradient: string;
  mockTitle: string;
  mockMessage?: string;
  mockCta?: string;
}> = {
  'New Release': {
    icon: Music,
    gradient: 'from-purple-900/80 via-purple-800/60 to-transparent',
    mockTitle: 'New Single',
    mockMessage: 'Out Now',
    mockCta: 'Listen Now',
  },
  'Tour Announcement': {
    icon: Calendar,
    gradient: 'from-blue-900/80 to-blue-800/40',
    mockTitle: 'TOUR 2026',
    mockMessage: '📍 Venue · 📅 Date',
    mockCta: 'See Dates',
  },
  'Merch Drop': {
    icon: ShoppingBag,
    gradient: 'from-amber-900/80 via-amber-800/60 to-transparent',
    mockTitle: 'New Merch',
    mockMessage: '$29.99',
    mockCta: 'View Merch',
  },
  'Announcement': {
    icon: Megaphone,
    gradient: 'from-green-900/60 to-green-800/30',
    mockTitle: 'Big News!',
    mockMessage: 'Something special...',
  },
  'Behind the Scenes': {
    icon: Camera,
    gradient: 'from-rose-900/80 via-rose-800/60 to-transparent',
    mockTitle: '',
    mockMessage: 'In the studio...',
  },
  'Moment': {
    icon: Sparkles,
    gradient: 'from-cyan-900/80 via-cyan-800/60 to-transparent',
    mockTitle: '',
    mockMessage: 'Right now...',
  },
  'Minimal': {
    icon: Palette,
    gradient: 'from-gray-900/60 to-gray-800/30',
    mockTitle: '',
    mockMessage: 'Media only',
  },
};

export function TemplateThumbnail({ template }: TemplateThumbnailProps) {
  const visual = TEMPLATE_VISUALS[template.name] || TEMPLATE_VISUALS['Minimal'];
  const Icon = visual.icon;
  const layoutConfig = template.layout_config as { overlay?: string };
  const overlay = layoutConfig?.overlay || 'bottom';

  return (
    <div className="aspect-[9/16] bg-muted rounded-lg overflow-hidden relative">
      {/* Placeholder background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-muted-foreground/10 to-muted-foreground/5">
        <div className="absolute inset-0 opacity-30">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M0 0h20v20H0V0zm10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14z'/%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
      </div>

      {/* Center icon for placeholder */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon className="h-8 w-8 text-muted-foreground/30" />
      </div>

      {/* Overlay simulation based on template type */}
      {overlay === 'bottom' && (
        <div className={cn("absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t", visual.gradient)}>
          {visual.mockTitle && (
            <p className="text-white text-[10px] font-bold truncate">{visual.mockTitle}</p>
          )}
          {visual.mockMessage && (
            <p className="text-white/80 text-[8px] truncate">{visual.mockMessage}</p>
          )}
          {visual.mockCta && (
            <div className="mt-1 inline-block bg-primary text-primary-foreground text-[7px] px-1.5 py-0.5 rounded">
              {visual.mockCta}
            </div>
          )}
        </div>
      )}

      {overlay === 'full' && (
        <div className={cn("absolute inset-0 flex flex-col items-center justify-center p-2 bg-gradient-to-b", visual.gradient)}>
          {visual.mockTitle && (
            <p className="text-white text-[10px] font-bold text-center">{visual.mockTitle}</p>
          )}
          {visual.mockMessage && (
            <p className="text-white/80 text-[8px] text-center mt-1">{visual.mockMessage}</p>
          )}
          {visual.mockCta && (
            <div className="mt-2 bg-primary text-primary-foreground text-[7px] px-1.5 py-0.5 rounded">
              {visual.mockCta}
            </div>
          )}
        </div>
      )}

      {overlay === 'center' && (
        <div className="absolute inset-0 flex items-center justify-center p-2">
          <div className="bg-background/80 backdrop-blur-sm rounded p-2 text-center">
            {visual.mockTitle && (
              <p className="text-[9px] font-bold">{visual.mockTitle}</p>
            )}
            {visual.mockMessage && (
              <p className="text-muted-foreground text-[7px]">{visual.mockMessage}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
