import { useState, useEffect } from "react";
import { useLegalAcceptance, DocumentType } from "@/hooks/useLegalAcceptance";
import { LegalAcceptanceModal } from "./LegalAcceptanceModal";
import { Progress } from "@/components/ui/progress";

interface LegalFlowProps {
  userType: "fan" | "artist" | "brand";
  onComplete: () => void;
  children?: React.ReactNode;
}

export const LegalFlow = ({ userType, onComplete, children }: LegalFlowProps) => {
  const { documents, acceptances, loading, hasAcceptedCurrentVersion, getDocumentsForUserType, refetch } = useLegalAcceptance();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [requiredDocs, setRequiredDocs] = useState<typeof documents>([]);
  const [pendingDocs, setPendingDocs] = useState<typeof documents>([]);

  useEffect(() => {
    if (loading || documents.length === 0) return;

    const docsForUser = getDocumentsForUserType(userType);
    setRequiredDocs(docsForUser);

    // Filter to only documents that need acceptance (not accepted or outdated version)
    const pending = docsForUser.filter(doc => 
      !hasAcceptedCurrentVersion(doc.document_type as DocumentType)
    );
    setPendingDocs(pending);

    // If no pending docs, complete immediately
    if (pending.length === 0) {
      onComplete();
    }
  }, [loading, documents, acceptances, userType, getDocumentsForUserType, hasAcceptedCurrentVersion, onComplete]);

  const handleAccept = async () => {
    await refetch();
    
    if (currentIndex < pendingDocs.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  if (loading || documents.length === 0) {
    return children || null;
  }

  if (pendingDocs.length === 0) {
    return children || null;
  }

  const currentDoc = pendingDocs[currentIndex];
  if (!currentDoc) {
    return children || null;
  }

  const previousAcceptance = acceptances.find(a => a.document_type === currentDoc.document_type);
  const isReaccept = previousAcceptance && previousAcceptance.document_version !== currentDoc.current_version;

  const progress = ((currentIndex + 1) / pendingDocs.length) * 100;

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center p-4 pt-20 pb-safe">
      <div className="w-full max-w-md">
        {children}
        
        {pendingDocs.length > 1 && (
          <div className="mb-4 space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {currentIndex + 1} of {pendingDocs.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <LegalAcceptanceModal
          open={true}
          onAccept={handleAccept}
          documentType={currentDoc.document_type as DocumentType}
          title={currentDoc.title}
          documentPath={currentDoc.document_path}
          currentVersion={currentDoc.current_version}
          changelog={isReaccept ? currentDoc.changelog : undefined}
          isReaccept={isReaccept}
        />
      </div>
    </div>
  );
};

export default LegalFlow;
