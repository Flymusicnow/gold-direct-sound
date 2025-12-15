import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InboxLanguage, languageNames } from "@/i18n/inbox";

interface InboxLanguageSelectorProps {
  language: InboxLanguage;
  onLanguageChange: (lang: InboxLanguage) => void;
}

export function InboxLanguageSelector({
  language,
  onLanguageChange,
}: InboxLanguageSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="uppercase font-medium">{language}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => onLanguageChange("en")}
          className={language === "en" ? "bg-muted" : ""}
        >
          🇬🇧 {languageNames.en}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onLanguageChange("sv")}
          className={language === "sv" ? "bg-muted" : ""}
        >
          🇸🇪 {languageNames.sv}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
