import { useState, useEffect } from 'react';
import { Bug, Send, Loader2, Keyboard, ChevronDown } from 'lucide-react';
import { useContextualReport } from '@/hooks/useContextualReport';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { InboxLanguage, getInboxTranslation } from '@/i18n/inbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ReportIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function LanguageToggle({ 
  language, 
  onLanguageChange 
}: { 
  language: InboxLanguage; 
  onLanguageChange: (lang: InboxLanguage) => void;
}) {
  return (
    <div className="flex items-center gap-1 text-sm">
      <button
        type="button"
        onClick={() => onLanguageChange('en')}
        className={`min-w-[36px] min-h-[36px] px-2 py-1.5 rounded transition-colors ${
          language === 'en' 
            ? 'bg-primary text-primary-foreground font-medium' 
            : 'text-muted-foreground hover:text-foreground active:bg-muted'
        }`}
      >
        EN
      </button>
      <span className="text-muted-foreground">|</span>
      <button
        type="button"
        onClick={() => onLanguageChange('sv')}
        className={`min-w-[36px] min-h-[36px] px-2 py-1.5 rounded transition-colors ${
          language === 'sv' 
            ? 'bg-primary text-primary-foreground font-medium' 
            : 'text-muted-foreground hover:text-foreground active:bg-muted'
        }`}
      >
        SV
      </button>
    </div>
  );
}

export function ReportIssueDialog({ open, onOpenChange }: ReportIssueDialogProps) {
  const [userNote, setUserNote] = useState('');
  const [targetRoute, setTargetRoute] = useState<string>('');
  const [reproSteps, setReproSteps] = useState('');
  const [language, setLanguage] = useState<InboxLanguage>('en');
  const { submitReport, isSubmitting, currentRoute, refreshRoute, lastRoutes } = useContextualReport();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const t = (key: Parameters<typeof getInboxTranslation>[1]) => getInboxTranslation(language, key);

  // Refresh route when dialog opens to ensure context is current
  useEffect(() => {
    if (open) {
      refreshRoute();
      setTargetRoute(currentRoute);
    }
  }, [open, refreshRoute, currentRoute]);

  // Handle Cmd/Ctrl + Enter to submit
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && userNote.trim() && !isSubmitting) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    const success = await submitReport(
      userNote, 
      language, 
      targetRoute !== currentRoute ? targetRoute : undefined,
      reproSteps.trim() || undefined
    );
    
    if (success) {
      toast({
        title: `✅ ${t('reportSent')}`,
        description: t('reportSentDescription'),
      });
      setUserNote('');
      setReproSteps('');
      setTargetRoute('');
      onOpenChange(false);
    } else {
      toast({
        title: `❌ ${t('reportFailed')}`,
        description: t('reportFailedDescription'),
        variant: 'destructive',
      });
    }
  };

  // Build route options from last routes
  const routeOptions = Array.from(new Set([currentRoute, ...lastRoutes])).slice(0, 6);

  const content = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
          {t('currentPage')}: {currentRoute}
        </div>
        <LanguageToggle language={language} onLanguageChange={setLanguage} />
      </div>

      {/* Target Route Selector */}
      <div className="space-y-2">
        <Label htmlFor="target-route" className="text-sm">
          {language === 'sv' ? 'Vilken sida gäller det?' : 'Which page is the issue on?'}
        </Label>
        <Select value={targetRoute} onValueChange={setTargetRoute}>
          <SelectTrigger id="target-route" className="w-full">
            <SelectValue placeholder={language === 'sv' ? 'Välj sida...' : 'Select page...'} />
          </SelectTrigger>
          <SelectContent>
            {routeOptions.map((route) => (
              <SelectItem key={route} value={route}>
                {route === currentRoute ? `${route} (${language === 'sv' ? 'nuvarande' : 'current'})` : route}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Repro Steps Input */}
      <div className="space-y-2">
        <Label htmlFor="repro-steps" className="text-sm">
          {language === 'sv' ? 'Vad klickade du på?' : 'What did you click?'}
          <span className="text-muted-foreground ml-1">
            ({language === 'sv' ? 'valfritt' : 'optional'})
          </span>
        </Label>
        <Input
          id="repro-steps"
          placeholder={language === 'sv' ? 'Ex: "Klickade på artist kort"' : 'Ex: "Clicked on artist card"'}
          value={reproSteps}
          onChange={(e) => setReproSteps(e.target.value)}
          maxLength={100}
          className="text-sm"
        />
      </div>
      
      {/* Main Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm">
          {language === 'sv' ? 'Beskriv problemet' : 'Describe the issue'}
        </Label>
        <Textarea
          id="description"
          placeholder={t('whatWentWrong')}
          value={userNote}
          onChange={(e) => setUserNote(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[80px] resize-none"
          autoFocus={false}
        />
      </div>
      
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Keyboard className="h-3 w-3" />
        {isMobile ? 'Tap Send to submit' : 'Cmd/Ctrl + Enter to submit'}
      </p>
      
      <Button 
        onClick={handleSubmit} 
        disabled={isSubmitting || !userNote.trim()}
        className="w-full min-h-[44px]"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {t('sending')}
          </>
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            {t('sendReport')}
          </>
        )}
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="px-4 pb-safe-bottom">
          <DrawerHeader className="text-left pt-4">
            <DrawerTitle className="flex items-center gap-2 text-lg">
              <Bug className="h-5 w-5 text-primary" />
              {t('reportIssue')}
            </DrawerTitle>
            <DrawerDescription className="text-sm">
              {t('reportIssueDescription')}
            </DrawerDescription>
          </DrawerHeader>
          <div className="pb-6">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-primary" />
            {t('reportIssue')}
          </DialogTitle>
          <DialogDescription>
            {t('reportIssueDescription')}
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
