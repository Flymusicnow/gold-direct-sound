import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { InboxLanguage, getInboxTranslation } from "@/i18n/inbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface QuickResolveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolve: (details: {
    problem: string;
    fix: string;
    verification: string;
    testedOn: string[];
  }) => Promise<boolean>;
  language?: InboxLanguage;
  issueTitle?: string;
  issueRoute?: string;
  onAdvancedClick?: () => void;
}

type ResolutionType = 'bugFixed' | 'uiFix' | 'logicUpdated' | 'dataCorrected' | 'invalidReport';

const resolutionTypeToFix: Record<ResolutionType, { en: string; sv: string }> = {
  bugFixed: { en: 'Fixed the underlying bug in the code', sv: 'Åtgärdade den underliggande buggen i koden' },
  uiFix: { en: 'Corrected the UI/visual issue', sv: 'Korrigerade UI/visuella problemet' },
  logicUpdated: { en: 'Updated the logic to handle the case correctly', sv: 'Uppdaterade logiken för att hantera fallet korrekt' },
  dataCorrected: { en: 'Corrected the data in the database', sv: 'Korrigerade datan i databasen' },
  invalidReport: { en: 'Confirmed as working correctly - no fix needed', sv: 'Bekräftat som fungerande - ingen fix behövdes' },
};

export function QuickResolveDialog({
  open,
  onOpenChange,
  onResolve,
  language = "en",
  issueTitle = "",
  issueRoute = "",
  onAdvancedClick,
}: QuickResolveDialogProps) {
  const [resolutionType, setResolutionType] = useState<ResolutionType | "">("");
  const [testedOn, setTestedOn] = useState<string[]>(["Desktop"]);
  const [submitting, setSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const t = (key: string) => getInboxTranslation(language, key as any);

  const platforms = [
    { id: "Desktop", label: t("platformDesktop") },
    { id: "iPhone", label: t("platformIPhone") },
    { id: "Android", label: t("platformAndroid") },
  ];

  const resolutionOptions: { value: ResolutionType; label: string }[] = [
    { value: "bugFixed", label: t("bugFixed") },
    { value: "uiFix", label: t("uiFix") },
    { value: "logicUpdated", label: t("logicUpdated") },
    { value: "dataCorrected", label: t("dataCorrected") },
    { value: "invalidReport", label: t("invalidReport") },
  ];

  const handleTestedOnChange = (platform: string, checked: boolean) => {
    if (checked) {
      setTestedOn((prev) => [...prev, platform]);
    } else {
      setTestedOn((prev) => prev.filter((p) => p !== platform));
    }
  };

  const isValid = resolutionType !== "" && testedOn.length > 0;

  const handleSubmit = async () => {
    if (!isValid || !resolutionType) return;

    setSubmitting(true);

    // Auto-generate problem description
    const problem = issueTitle 
      ? `${issueTitle}${issueRoute ? ` (on ${issueRoute})` : ''}`
      : language === 'sv' ? 'Problem löst' : 'Issue resolved';

    // Get fix description from resolution type
    const fix = resolutionTypeToFix[resolutionType][language];

    // Auto-generate verification
    const verification = t("autoVerificationText");

    const success = await onResolve({
      problem,
      fix,
      verification,
      testedOn,
    });

    if (success) {
      // Reset form
      setResolutionType("");
      setTestedOn(["Desktop"]);
      onOpenChange(false);
    }

    setSubmitting(false);
  };

  const handleAdvancedClick = () => {
    onOpenChange(false);
    onAdvancedClick?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[95vw] max-w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            {t("quickResolve")}
          </DialogTitle>
          <DialogDescription>
            {language === 'sv' 
              ? 'Markera problemet som löst snabbt.' 
              : 'Mark the issue as resolved quickly.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Resolution Type Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="resolution-type">{t("resolutionType")}</Label>
            <Select
              value={resolutionType}
              onValueChange={(value) => setResolutionType(value as ResolutionType)}
            >
              <SelectTrigger id="resolution-type" className="w-full">
                <SelectValue placeholder={t("selectResolutionType")} />
              </SelectTrigger>
              <SelectContent>
                {resolutionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Platform Checkboxes */}
          <div className="space-y-3">
            <Label>{t("testedOnLabel")}</Label>
            <div className="flex flex-wrap gap-4">
              {platforms.map((platform) => (
                <div key={platform.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`platform-${platform.id}`}
                    checked={testedOn.includes(platform.id)}
                    onCheckedChange={(checked) =>
                      handleTestedOnChange(platform.id, checked as boolean)
                    }
                    className="min-h-[24px] min-w-[24px]"
                  />
                  <Label
                    htmlFor={`platform-${platform.id}`}
                    className="text-sm cursor-pointer min-h-[44px] flex items-center"
                  >
                    {platform.label}
                  </Label>
                </div>
              ))}
            </div>
            {testedOn.length === 0 && (
              <p className="text-sm text-destructive">{t("selectAtLeastOnePlatform")}</p>
            )}
          </div>

          {/* Advanced Option */}
          {onAdvancedClick && (
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-between text-muted-foreground hover:text-foreground"
                >
                  {t("addDetailedResolution")}
                  {showAdvanced ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleAdvancedClick}
                >
                  {t("advancedResolve")}
                </Button>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            {t("cancel")}
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!isValid || submitting}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {submitting ? t("saving") : t("markAsResolved")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
