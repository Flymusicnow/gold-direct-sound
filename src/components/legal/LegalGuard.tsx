import { useState, useEffect } from "react";
import { useLegalAcceptance, DocumentType } from "@/hooks/useLegalAcceptance";
import { LegalAcceptanceModal } from "./LegalAcceptanceModal";

interface LegalGuardProps {
  children: React.ReactNode;
  requiredDocuments?: DocumentType[];
  blockOnMissing?: boolean;
}

export const LegalGuard = ({ 
  children, 
  requiredDocuments,
  blockOnMissing = false 
}: LegalGuardProps) => {
  const { documents, acceptances, loading, getDocumentsNeedingReaccept, refetch } = useLegalAcceptance();
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [completed, setCompleted] = useState(false);

  const docsNeedingReaccept = getDocumentsNeedingReaccept().filter(doc => {
    if (!requiredDocuments) return true;
    return requiredDocuments.includes(doc.document_type as DocumentType);
  });

  useEffect(() => {
    if (loading) return;
    
    if (docsNeedingReaccept.length > 0 && blockOnMissing) {
      setShowModal(true);
    }
  }, [loading, docsNeedingReaccept.length, blockOnMissing]);

  const handleAccept = async () => {
    await refetch();
    
    if (currentDocIndex < docsNeedingReaccept.length - 1) {
      setCurrentDocIndex(prev => prev + 1);
    } else {
      setShowModal(false);
      setCurrentDocIndex(0);
      setCompleted(true);
    }
  };

  if (loading) {
    return <>{children}</>;
  }

  // If blocking and we have docs needing re-accept, show modal
  if (blockOnMissing && docsNeedingReaccept.length > 0 && !completed) {
    const currentDoc = docsNeedingReaccept[currentDocIndex];
    const previousAcceptance = acceptances.find(a => a.document_type === currentDoc?.document_type);
    const isReaccept = previousAcceptance && previousAcceptance.document_version !== currentDoc?.current_version;

    return (
      <>
        {children}
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
  }

  return <>{children}</>;
};

export default LegalGuard;
