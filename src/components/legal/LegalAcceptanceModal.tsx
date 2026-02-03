import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Loader2, ExternalLink, AlertCircle, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { DocumentType } from "@/hooks/useLegalAcceptance";
import { useLanguage } from "@/contexts/LanguageContext";
import { getClientIp } from "@/utils/getClientIp";

interface LegalAcceptanceModalProps {
  open: boolean;
  onAccept: () => void;
  documentType: DocumentType;
  title: string;
  documentPath: string;
  currentVersion?: string;
  changelog?: string | null;
  isReaccept?: boolean;
}

export const LegalAcceptanceModal = ({
  open,
  onAccept,
  documentType,
  title,
  documentPath,
  currentVersion = "1.0",
  changelog,
  isReaccept = false
}: LegalAcceptanceModalProps) => {
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Get the appropriate document path based on language
  const getLocalizedDocumentPath = (basePath: string): string => {
    // For beta terms, we have language-specific versions
    if (basePath.includes('beta-terms')) {
      return `/legal/beta-terms-${language}.md`;
    }
    return basePath;
  };

  const localizedDocumentPath = getLocalizedDocumentPath(documentPath);

  useEffect(() => {
    const loadDocument = async () => {
      try {
        setLoading(true);
        const response = await fetch(localizedDocumentPath);
        if (!response.ok) {
          // Fallback to English if localized version not found
          const fallbackResponse = await fetch(documentPath);
          if (!fallbackResponse.ok) throw new Error("Document not found");
          const text = await fallbackResponse.text();
          setContent(text);
        } else {
          const text = await response.text();
          setContent(text);
        }
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
  }, [localizedDocumentPath, documentPath, open]);

  const handleAccept = async () => {
    if (!user || !accepted) return;
    
    setSubmitting(true);
    try {
      // Verify session is valid before attempting RLS-protected insert
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        // Try to refresh the session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshData.session) {
          console.error("Session not available:", refreshError);
          toast.error(t('errors.sessionExpired') || "Session expired. Please sign in again.");
          return;
        }
      }

      // Get client IP for audit trail
      const ipAddress = await getClientIp();

      const { error } = await supabase.from("legal_acceptances").insert({
        user_id: user.id,
        document_type: documentType,
        document_version: currentVersion,
        user_agent: navigator.userAgent,
        ip_address: ipAddress,
        accepted_language: language
      });

      if (error) throw error;
      
      toast.success(t('legal.accepted') || `${title} accepted`);
      onAccept();
    } catch (err) {
      console.error("Failed to record acceptance:", err);
      toast.error(t('legal.acceptFailed') || "Failed to record acceptance. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Professional markdown rendering for legal documents
  const renderMarkdown = (md: string) => {
    const externalLinkSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline ml-1"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>';
    
    return md
      // Headers - styled professionally for legal documents
      .replace(/^### (.*$)/gim, '<h3 class="text-base font-semibold mt-6 mb-3 text-foreground">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold mt-8 mb-4 text-foreground border-b border-border pb-2">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold mt-4 mb-4 text-foreground">$1</h1>')
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Links with external icon
      .replace(/\[(.*?)\]\((.*?)\)/g, `<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline inline-flex items-center">$1${externalLinkSvg}</a>`)
      // Horizontal rules
      .replace(/^---$/gim, '<hr class="my-6 border-border" />')
      // List items - properly styled
      .replace(/^- (.*$)/gim, '<li class="ml-4 mb-2 text-muted-foreground list-disc">$1</li>')
      // Paragraphs
      .replace(/\n\n/g, '</p><p class="mb-4 text-sm text-muted-foreground leading-relaxed">')
      .replace(/\n/g, '<br />');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'sv' : 'en');
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col [&>button]:hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle>
                  {language === 'sv' ? 'Användarvillkor (Beta)' : 'Terms & Conditions (Beta)'}
                </DialogTitle>
                <DialogDescription>
                  {isReaccept 
                    ? (language === 'sv' ? 'Detta dokument har uppdaterats. Läs igenom och godkänn.' : 'This document has been updated. Please review and accept.')
                    : (language === 'sv' ? 'Läs och godkänn för att fortsätta' : 'Please read and accept to continue')
                  }
                </DialogDescription>
              </div>
            </div>
            {/* Language toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLanguage}
              className="flex items-center gap-2"
            >
              <Globe className="h-4 w-4" />
              {language === 'en' ? 'Svenska' : 'English'}
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <a 
              href={localizedDocumentPath} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              {language === 'sv' ? 'Läs hela dokumentet i ny flik' : 'Read full document in new tab'}
            </a>
            <span className="text-xs text-muted-foreground">
              {language === 'sv' ? 'Version: ' : 'Version: '}{currentVersion}
            </span>
          </div>
        </DialogHeader>

        {/* Changelog for re-acceptance */}
        {isReaccept && changelog && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <h4 className="font-semibold text-sm">
                {language === 'sv' ? 'Vad som ändrats' : "What's Changed"}
              </h4>
            </div>
            <p className="text-sm text-muted-foreground">{changelog}</p>
          </div>
        )}

        <div className="flex-1 max-h-[50vh] overflow-y-auto border rounded-lg bg-muted/20">
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: `<p class="mb-4 text-sm text-muted-foreground leading-relaxed">${renderMarkdown(content)}</p>` 
                }}
              />
            )}
          </div>
        </div>

        {/* Language precedence notice */}
        <p className="text-xs text-muted-foreground text-center italic">
          {language === 'sv' 
            ? 'Vid tolkningsskillnader har den engelska versionen företräde.' 
            : 'In case of discrepancies, the English version shall prevail.'
          }
        </p>

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
              {language === 'sv' 
                ? `Jag har läst och godkänner ${title}` 
                : `I have read and accept the ${title}`
              }
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
                {language === 'sv' ? 'Bearbetar...' : 'Processing...'}
              </>
            ) : (
              language === 'sv' ? 'Godkänn & Fortsätt' : 'Accept & Continue'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LegalAcceptanceModal;
