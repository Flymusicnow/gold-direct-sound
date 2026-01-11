import { SpotlightTemplate } from "@/hooks/useSpotlightTemplates";
import { SpotlightTemplateOverlay } from "@/components/spotlight/SpotlightTemplateOverlay";

interface SpotlightTemplatePreviewProps {
  template: SpotlightTemplate;
  mediaUrl: string | null;
  mediaType: 'image' | 'video';
  fields: Record<string, string>;
}

export function SpotlightTemplatePreview({
  template,
  mediaUrl,
  mediaType,
  fields,
}: SpotlightTemplatePreviewProps) {
  const layoutConfig = template.layout_config as { overlay?: string };
  
  return (
    <div className="relative aspect-[9/16] bg-card rounded-xl overflow-hidden">
      {/* Phone Frame */}
      <div className="absolute inset-0 pointer-events-none z-20">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-background rounded-b-2xl" />
      </div>

      {/* Media */}
      {mediaUrl ? (
        mediaType === 'video' ? (
          <video
            src={mediaUrl}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <img
            src={mediaUrl}
            alt="Preview"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">No media</p>
        </div>
      )}

      {/* Template Overlay */}
      <SpotlightTemplateOverlay
        templateData={fields}
        templateName={template.name}
        layoutConfig={layoutConfig}
      />
    </div>
  );
}
