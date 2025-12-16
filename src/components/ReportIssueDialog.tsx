import { useState } from 'react';
import { Bug, Send, Loader2 } from 'lucide-react';
import { useContextualReport } from '@/hooks/useContextualReport';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
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

export function ReportIssueDialog({ open, onOpenChange }: ReportIssueDialogProps) {
  const [userNote, setUserNote] = useState('');
  const { submitReport, isSubmitting, currentRoute } = useContextualReport();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleSubmit = async () => {
    const success = await submitReport(userNote);
    
    if (success) {
      toast({
        title: '✅ Rapport skickad',
        description: 'Tack! Vi tittar på det så snart vi kan.',
      });
      setUserNote('');
      onOpenChange(false);
    } else {
      toast({
        title: '❌ Kunde inte skicka',
        description: 'Försök igen senare.',
        variant: 'destructive',
      });
    }
  };

  const content = (
    <div className="space-y-4">
      <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
        Sida: {currentRoute}
      </div>
      
      <Textarea
        placeholder="Vad gick fel?"
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
            Skickar...
          </>
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            Skicka rapport
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
              Rapportera problem
            </DrawerTitle>
            <DrawerDescription>
              Beskriv vad som gick fel (valfritt)
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
            Rapportera problem
          </DialogTitle>
          <DialogDescription>
            Beskriv vad som gick fel (valfritt)
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
