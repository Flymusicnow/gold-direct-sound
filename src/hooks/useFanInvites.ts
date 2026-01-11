import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface FanInvite {
  id: string;
  stream_id: string;
  artist_id: string;
  invited_user_id: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  invited_at: string;
  responded_at: string | null;
  // Joined from profiles
  user_display_name?: string;
  user_avatar_url?: string;
}

export const useFanInvites = (streamId: string | null, artistId: string | null) => {
  const { user } = useAuth();
  const [invites, setInvites] = useState<FanInvite[]>([]);
  const [pendingInvite, setPendingInvite] = useState<FanInvite | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch invites for the stream (artist view)
  const fetchInvites = useCallback(async () => {
    if (!streamId) return;

    try {
      const { data, error } = await supabase
        .from("live_fan_invites")
        .select("*")
        .eq("stream_id", streamId)
        .order("invited_at", { ascending: false });

      if (error) throw error;
      setInvites((data || []) as FanInvite[]);
    } catch (err) {
      console.error("Error fetching invites:", err);
    }
  }, [streamId]);

  // Check for pending invites (fan view)
  const checkPendingInvite = useCallback(async () => {
    if (!user?.id || !streamId) return;

    try {
      const { data, error } = await supabase
        .from("live_fan_invites")
        .select("*")
        .eq("stream_id", streamId)
        .eq("invited_user_id", user.id)
        .eq("status", "pending")
        .maybeSingle();

      if (error) throw error;
      setPendingInvite(data as FanInvite | null);
    } catch (err) {
      console.error("Error checking pending invite:", err);
    }
  }, [user?.id, streamId]);

  // Invite a fan
  const inviteFan = useCallback(async (userId: string) => {
    if (!streamId || !artistId) return false;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("live_fan_invites")
        .insert({
          stream_id: streamId,
          artist_id: artistId,
          invited_user_id: userId,
          status: "pending",
        });

      if (error) throw error;
      
      toast.success("Invite sent!");
      await fetchInvites();
      return true;
    } catch (err) {
      console.error("Error inviting fan:", err);
      toast.error("Failed to send invite");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [streamId, artistId, fetchInvites]);

  // Cancel an invite (artist)
  const cancelInvite = useCallback(async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from("live_fan_invites")
        .update({ status: "cancelled" })
        .eq("id", inviteId);

      if (error) throw error;
      
      toast.info("Invite cancelled");
      await fetchInvites();
    } catch (err) {
      console.error("Error cancelling invite:", err);
      toast.error("Failed to cancel invite");
    }
  }, [fetchInvites]);

  // Accept invite (fan)
  const acceptInvite = useCallback(async () => {
    if (!pendingInvite) return false;

    try {
      const { error } = await supabase
        .from("live_fan_invites")
        .update({ 
          status: "accepted",
          responded_at: new Date().toISOString()
        })
        .eq("id", pendingInvite.id);

      if (error) throw error;
      
      setPendingInvite(null);
      toast.success("You're joining the stage!");
      return true;
    } catch (err) {
      console.error("Error accepting invite:", err);
      toast.error("Failed to accept invite");
      return false;
    }
  }, [pendingInvite]);

  // Decline invite (fan)
  const declineInvite = useCallback(async () => {
    if (!pendingInvite) return;

    try {
      const { error } = await supabase
        .from("live_fan_invites")
        .update({ 
          status: "declined",
          responded_at: new Date().toISOString()
        })
        .eq("id", pendingInvite.id);

      if (error) throw error;
      
      setPendingInvite(null);
      toast.info("Invite declined");
    } catch (err) {
      console.error("Error declining invite:", err);
      toast.error("Failed to decline invite");
    }
  }, [pendingInvite]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!streamId) return;

    fetchInvites();
    checkPendingInvite();

    const channel = supabase
      .channel(`invites-${streamId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_fan_invites",
          filter: `stream_id=eq.${streamId}`,
        },
        () => {
          fetchInvites();
          checkPendingInvite();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId, fetchInvites, checkPendingInvite]);

  return {
    invites,
    pendingInvite,
    isLoading,
    inviteFan,
    cancelInvite,
    acceptInvite,
    declineInvite,
    refetch: fetchInvites,
  };
};
