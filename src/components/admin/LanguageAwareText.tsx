import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Languages } from "lucide-react";
import { InboxLanguage, languageNames } from "@/i18n/inbox";

interface LanguageAwareTextProps {
  text: string;
  contentLanguage?: InboxLanguage;
  viewerLanguage: InboxLanguage;
  className?: string;
}

export function LanguageAwareText({
  text,
  contentLanguage,
  viewerLanguage,
  className = "",
}: LanguageAwareTextProps) {
  const [showTranslateHint, setShowTranslateHint] = useState(false);

  // If no content language specified or same as viewer, just show text
  if (!contentLanguage || contentLanguage === viewerLanguage) {
    return <span className={className}>{text}</span>;
  }

  // Content is in a different language than viewer preference
  return (
    <div className="space-y-1">
      <span className={className}>{text}</span>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
          <Languages className="h-3 w-3" />
          {languageNames[contentLanguage]}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 px-2 text-xs text-primary hover:text-primary"
          onClick={() => setShowTranslateHint(true)}
        >
          Translate
        </Button>
      </div>
      {showTranslateHint && (
        <p className="text-xs text-muted-foreground italic">
          Manual translation coming in Phase 2
        </p>
      )}
    </div>
  );
}
