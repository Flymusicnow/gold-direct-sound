import { useState } from "react";
import { useLegalAcceptance, DocumentType } from "@/hooks/useLegalAcceptance";
import { LegalAcceptanceModal } from "./LegalAcceptanceModal";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const LegalUpdateBanner = () => {
  const { getDocumentsNeedingReaccept, acceptances, refetch } = useLegalAcceptance();
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const docsNeedingReaccept = getDocumentsNeedingReaccept();

  if (docsNeedingReaccept.length === 0 || dismissed) {
    return null;
  }

  const currentDoc = docsNeedingReaccept[currentDocIndex];
  const previousAcceptance = acceptances.find(a => a.document_type === currentDoc?.document_type);
  const isReaccept = previousAcceptance && previousAcceptance.document_version !== currentDoc?.current_version;

  const handleAccept = async () => {
    await refetch();
    
    if (currentDocIndex < docsNeedingReaccept.length - 1) {
      setCurrentDocIndex(prev => prev + 1);
    } else {
      setShowModal(false);
      setCurrentDocIndex(0);
    }
  };

  return (
    <>
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-sm">
              <span className="font-medium">Our terms have been updated.</span>
              <span className="text-muted-foreground ml-1">
                Please review and accept the new terms to continue.
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              onClick={() => setShowModal(true)}
              className="shrink-0"
            >
              Review Updates
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDismissed(true)}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {showModal && currentDoc && (
        <LegalAcceptanceModal
          open={showModal}
          onAccept={handleAccept}
          documentType={currentDoc.document_type as DocumentType}
          title={currentDoc.title}
          documentPath={currentDoc.document_path}
          currentVersion={currentDoc.current_version}
          changelog={isReaccept ? currentDoc.changelog : undefined}
          isReaccept={isReaccept}
        />
      )}
    </>
  );
};

export default LegalUpdateBanner;
