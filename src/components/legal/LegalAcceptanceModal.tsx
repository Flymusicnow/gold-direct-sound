import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface LegalAcceptanceModalProps {
  open: boolean;
  onAccept: () => void;
  documentType: "user_agreement" | "artist_agreement" | "privacy_policy" | "fan_terms";
  title: string;
  documentPath: string;
}

export const LegalAcceptanceModal = ({
  open,
  onAccept,
  documentType,
  title,
  documentPath
}: LegalAcceptanceModalProps) => {
  const { user } = useAuth();
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadDocument = async () => {
      try {
        setLoading(true);
        const response = await fetch(documentPath);
        if (!response.ok) throw new Error("Document not found");
        const text = await response.text();
        setContent(text);
      } catch (err) {
        console.error("Failed to load document:", err);
      } finally {
        setLoading(false);
      }
    };
    if (open) {
      loadDocument();
      setAccepted(false);
    }
  }, [documentPath, open]);

  const handleAccept = async () => {
    if (!user || !accepted) return;
    
    setSubmitting(true);
    try {
      const { error } = await supabase.from("legal_acceptances").insert({
        user_id: user.id,
        document_type: documentType,
        document_version: "1.0",
        user_agent: navigator.userAgent
      });

      if (error) throw error;
      
      toast.success(`${title} accepted`);
      onAccept();
    } catch (err) {
      console.error("Failed to record acceptance:", err);
      toast.error("Failed to record acceptance. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Simple markdown rendering
  const renderMarkdown = (md: string) => {
    return md
      .replace(/^### (.*$)/gim, '<h3 class="text-base font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold mt-6 mb-2 text-primary">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold mt-4 mb-3 text-primary">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-primary hover:underline">$1</a>')
      .replace(/^---$/gim, '<hr class="my-4 border-border" />')
      .replace(/^- (.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
      .replace(/\n\n/g, '</p><p class="mb-3 text-sm text-muted-foreground">')
      .replace(/\n/g, '<br />');
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col [&>button]:hidden">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>
                Please read and accept to continue
              </DialogDescription>
            </div>
          </div>
          <a 
            href={documentPath} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center gap-1 mt-2"
          >
            <ExternalLink className="h-3 w-3" />
            Read full document in new tab
          </a>
        </DialogHeader>

        <div className="flex-1 max-h-[50vh] overflow-y-auto border rounded-lg bg-muted/20">
          <div className="p-4 pr-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div 
                className="prose prose-sm max-w-none text-sm"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
              />
            )}
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-start gap-3">
            <Checkbox 
              id="accept-terms" 
              checked={accepted}
              onCheckedChange={(checked) => setAccepted(checked === true)}
              disabled={loading}
            />
            <label 
              htmlFor="accept-terms" 
              className="text-sm text-muted-foreground cursor-pointer leading-relaxed"
            >
              I have read and accept the {title}
            </label>
          </div>

          <Button 
            onClick={handleAccept} 
            disabled={!accepted || submitting}
            className="w-full bg-gradient-gold"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LegalAcceptanceModal;
