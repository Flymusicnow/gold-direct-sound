import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type DocumentType = "user_agreement" | "artist_agreement" | "privacy_policy" | "fan_terms" | "brand_portal_terms" | "risk_disclaimer";

interface LegalAcceptance {
  document_type: string;
  accepted_at: string;
  document_version: string;
}

export const useLegalAcceptance = () => {
  const { user } = useAuth();
  const [acceptances, setAcceptances] = useState<LegalAcceptance[]>([]);
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

  useEffect(() => {
    fetchAcceptances();
  }, [fetchAcceptances]);

  const hasAccepted = useCallback((documentType: DocumentType): boolean => {
    return acceptances.some(a => a.document_type === documentType);
  }, [acceptances]);

  const getAcceptanceDate = useCallback((documentType: DocumentType): string | null => {
    const acceptance = acceptances.find(a => a.document_type === documentType);
    return acceptance?.accepted_at || null;
  }, [acceptances]);

  const hasAcceptedRequired = useCallback((requiredDocuments: DocumentType[]): boolean => {
    return requiredDocuments.every(doc => hasAccepted(doc));
  }, [hasAccepted]);

  const getMissingDocuments = useCallback((requiredDocuments: DocumentType[]): DocumentType[] => {
    return requiredDocuments.filter(doc => !hasAccepted(doc));
  }, [hasAccepted]);

  return {
    acceptances,
    loading,
    hasAccepted,
    getAcceptanceDate,
    hasAcceptedRequired,
    getMissingDocuments,
    refetch: fetchAcceptances
  };
};

export default useLegalAcceptance;
