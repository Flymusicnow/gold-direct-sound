import { useState } from 'react';
import { Bug, Send, Loader2 } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

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
    <div className="flex items-center gap-1 text-xs">
      <button
        type="button"
        onClick={() => onLanguageChange('en')}
        className={`px-2 py-1 rounded transition-colors ${
          language === 'en' 
            ? 'bg-primary text-primary-foreground font-medium' 
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        EN
      </button>
      <span className="text-muted-foreground">|</span>
      <button
        type="button"
        onClick={() => onLanguageChange('sv')}
        className={`px-2 py-1 rounded transition-colors ${
          language === 'sv' 
            ? 'bg-primary text-primary-foreground font-medium' 
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        SV
      </button>
    </div>
  );
}

export function ReportIssueDialog({ open, onOpenChange }: ReportIssueDialogProps) {
  const [userNote, setUserNote] = useState('');
  const [language, setLanguage] = useState<InboxLanguage>('en');
  const { submitReport, isSubmitting, currentRoute } = useContextualReport();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const t = (key: Parameters<typeof getInboxTranslation>[1]) => getInboxTranslation(language, key);

  const handleSubmit = async () => {
    const success = await submitReport(userNote, language);
    
    if (success) {
      toast({
        title: `✅ ${t('reportSent')}`,
        description: t('reportSentDescription'),
      });
      setUserNote('');
      onOpenChange(false);
    } else {
      toast({
        title: `❌ ${t('reportFailed')}`,
        description: t('reportFailedDescription'),
        variant: 'destructive',
      });
    }
  };

  const content = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
          {t('currentPage')}: {currentRoute}
        </div>
        <LanguageToggle language={language} onLanguageChange={setLanguage} />
      </div>
      
      <Textarea
        placeholder={t('whatWentWrong')}
        value={userNote}
        onChange={(e) => setUserNote(e.target.value)}
        className="min-h-[100px] resize-none"
        autoFocus={false}
      />
      
      <Button 
        onClick={handleSubmit} 
        disabled={isSubmitting}
        className="w-full"
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
        <DrawerContent className="px-4 pb-8">
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-primary" />
              {t('reportIssue')}
            </DrawerTitle>
            <DrawerDescription>
              {t('reportIssueDescription')}
            </DrawerDescription>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
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
