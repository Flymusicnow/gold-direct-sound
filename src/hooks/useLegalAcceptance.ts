import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type DocumentType = "user_agreement" | "artist_agreement" | "privacy_policy" | "fan_terms" | "brand_portal_terms" | "risk_disclaimer" | "beta_terms";

interface LegalAcceptance {
  document_type: string;
  accepted_at: string;
  document_version: string;
}

interface LegalDocument {
  id: string;
  document_type: string;
  current_version: string;
  title: string;
  document_path: string;
  requires_reaccept: boolean;
  changelog: string | null;
  last_updated: string;
}

export const useLegalAcceptance = () => {
  const { user } = useAuth();
  const [acceptances, setAcceptances] = useState<LegalAcceptance[]>([]);
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAcceptances = useCallback(async () => {
    if (!user) {
      setAcceptances([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("legal_acceptances")
        .select("document_type, accepted_at, document_version")
        .eq("user_id", user.id);

      if (error) throw error;
      setAcceptances(data || []);
    } catch (err) {
      console.error("Failed to fetch legal acceptances:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchDocuments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("legal_documents")
        .select("*");

      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      console.error("Failed to fetch legal documents:", err);
    }
  }, []);

  useEffect(() => {
    fetchAcceptances();
    fetchDocuments();
  }, [fetchAcceptances, fetchDocuments]);

  const hasAccepted = useCallback((documentType: DocumentType): boolean => {
    return acceptances.some(a => a.document_type === documentType);
  }, [acceptances]);

  const hasAcceptedCurrentVersion = useCallback((documentType: DocumentType): boolean => {
    const acceptance = acceptances.find(a => a.document_type === documentType);
    const document = documents.find(d => d.document_type === documentType);
    
    if (!acceptance || !document) return false;
    return acceptance.document_version === document.current_version;
  }, [acceptances, documents]);

  const getAcceptanceDate = useCallback((documentType: DocumentType): string | null => {
    const acceptance = acceptances.find(a => a.document_type === documentType);
    return acceptance?.accepted_at || null;
  }, [acceptances]);

  const hasAcceptedRequired = useCallback((requiredDocuments: DocumentType[]): boolean => {
    return requiredDocuments.every(doc => hasAccepted(doc));
  }, [hasAccepted]);

  const hasAcceptedRequiredCurrentVersions = useCallback((requiredDocuments: DocumentType[]): boolean => {
    return requiredDocuments.every(doc => hasAcceptedCurrentVersion(doc));
  }, [hasAcceptedCurrentVersion]);

  const getMissingDocuments = useCallback((requiredDocuments: DocumentType[]): DocumentType[] => {
    return requiredDocuments.filter(doc => !hasAccepted(doc));
  }, [hasAccepted]);

  const getDocumentsNeedingReaccept = useCallback((): LegalDocument[] => {
    return documents.filter(doc => {
      if (!doc.requires_reaccept) return false;
      const acceptance = acceptances.find(a => a.document_type === doc.document_type);
      if (!acceptance) return true;
      return acceptance.document_version !== doc.current_version;
    });
  }, [acceptances, documents]);

  const getDocumentInfo = useCallback((documentType: DocumentType): LegalDocument | undefined => {
    return documents.find(d => d.document_type === documentType);
  }, [documents]);

  const getDocumentsForUserType = useCallback((userType: "fan" | "artist" | "brand"): LegalDocument[] => {
    // For beta: All user types require beta_terms only
    // This includes the NDA and all required legal agreements for beta
    const typeMap: Record<string, DocumentType[]> = {
      fan: ["beta_terms"],
      artist: ["beta_terms"],
      brand: ["beta_terms"]
    };

    const requiredTypes = typeMap[userType] || [];
    return documents.filter(d => requiredTypes.includes(d.document_type as DocumentType));
  }, [documents]);

  return {
    acceptances,
    documents,
    loading,
    hasAccepted,
    hasAcceptedCurrentVersion,
    getAcceptanceDate,
    hasAcceptedRequired,
    hasAcceptedRequiredCurrentVersions,
    getMissingDocuments,
    getDocumentsNeedingReaccept,
    getDocumentInfo,
    getDocumentsForUserType,
    refetch: fetchAcceptances
  };
};

export default useLegalAcceptance;
