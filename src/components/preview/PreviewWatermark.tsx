import { Lock } from "lucide-react";

/**
 * Floating watermark/badge shown on preview pages to indicate limited functionality
 * Positioned at bottom-right, above mobile nav if present
 */
export function PreviewWatermark() {
  return (
    <div className="fixed bottom-24 right-4 z-40 pointer-events-none md:bottom-8">
      <div className="bg-primary/10 backdrop-blur-sm border border-primary/30 rounded-full px-4 py-2 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-primary animate-ping" />
          </div>
          <Lock className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-primary uppercase tracking-wide">
            Preview Mode
          </span>
        </div>
      </div>
    </div>
  );
}
