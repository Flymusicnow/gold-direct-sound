import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ArtistVerification {
  id: string;
  user_id: string;
  verification_status: string;
  submitted_at: string | null;
  verified_at: string | null;
  verified_by: string | null;
  rejection_reason: string | null;
  verification_type: string;
  documents_url: string[] | null;
  created_at: string;
  updated_at: string;
}

export function useArtistVerification(userId?: string) {
  const { user } = useAuth();
  const [verification, setVerification] = useState<ArtistVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  const targetUserId = userId || user?.id;

  useEffect(() => {
    if (targetUserId) {
      fetchVerification();
    } else {
      setLoading(false);
    }
  }, [targetUserId]);

  const fetchVerification = async () => {
    if (!targetUserId) return;

    try {
      const { data, error } = await supabase
        .from("artist_verifications")
        .select("*")
        .eq("user_id", targetUserId)
        .maybeSingle();

      if (!error && data) {
        setVerification(data as ArtistVerification);
        setIsVerified(data.verification_status === "verified");
      }
    } catch (error) {
      console.error("Error fetching verification:", error);
    } finally {
      setLoading(false);
    }
  };

  const submitVerification = async (documentsUrl: string[]) => {
    if (!user) return { success: false, error: "Not authenticated" };

    try {
      const { data: existing } = await supabase
        .from("artist_verifications")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("artist_verifications")
          .update({
            documents_url: documentsUrl,
            verification_status: "submitted",
            submitted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("artist_verifications")
          .insert({
            user_id: user.id,
            documents_url: documentsUrl,
            verification_status: "submitted",
            submitted_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      await fetchVerification();
      return { success: true };
    } catch (error: any) {
      console.error("Error submitting verification:", error);
      return { success: false, error: error.message };
    }
  };

  return {
    verification,
    loading,
    isVerified,
    submitVerification,
    refetch: fetchVerification,
  };
}
