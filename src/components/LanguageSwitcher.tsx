import { useLanguage } from '@/contexts/LanguageContext';
import { Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface LanguageSwitcherProps {
  showLabel?: boolean;
  className?: string;
}

export function LanguageSwitcher({ showLabel = true, className = '' }: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {showLabel && (
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Globe className="h-4 w-4" />
          {t('settings.languagePreference')}
        </Label>
      )}
      <Select value={language} onValueChange={(val) => setLanguage(val as 'en' | 'sv')}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">
            <span className="flex items-center gap-2">
              <span>🇺🇸</span>
              {t('language.english')}
            </span>
          </SelectItem>
          <SelectItem value="sv">
            <span className="flex items-center gap-2">
              <span>🇸🇪</span>
              {t('language.swedish')}
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
      {showLabel && (
        <p className="text-sm text-muted-foreground">
          {t('settings.languagePreferenceDescription')}
        </p>
      )}
    </div>
  );
}
