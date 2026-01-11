import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface StageRequest {
  id: string;
  stream_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'denied' | 'on_stage' | 'kicked';
  requested_at: string;
  approved_at?: string;
  denied_at?: string;
  kicked_at?: string;
  kick_reason?: string;
  profile?: {
    full_name: string;
    avatar_url?: string;
  };
}

interface UseStageRequestsReturn {
  pendingRequests: StageRequest[];
  onStageUsers: StageRequest[];
  myRequest: StageRequest | null;
  isLoading: boolean;
  // Fan methods
  raiseHand: () => Promise<void>;
  lowerHand: () => Promise<void>;
  // Artist methods
  approveRequest: (requestId: string) => Promise<void>;
  denyRequest: (requestId: string) => Promise<void>;
  kickFromStage: (requestId: string, reason?: string) => Promise<void>;
  panicCloseAll: () => Promise<void>;
}

/**
 * useStageRequests - Manages fan-on-stage request queue
 * Per SUPER CARD:
 * - Raise Hand creates a request, not a connection
 * - Artist explicitly approves every participant
 * - No automatic joins, ever
 */
export function useStageRequests(
  streamId: string,
  isArtist: boolean
): UseStageRequestsReturn {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pendingRequests, setPendingRequests] = useState<StageRequest[]>([]);
  const [onStageUsers, setOnStageUsers] = useState<StageRequest[]>([]);
  const [myRequest, setMyRequest] = useState<StageRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch requests
  const fetchRequests = useCallback(async () => {
    if (!streamId) return;
    
    try {
      setIsLoading(true);
      
      if (isArtist) {
        // Artist sees all pending and on_stage requests
        const { data, error } = await supabase
          .from('live_stage_requests')
          .select('*')
          .eq('stream_id', streamId)
          .in('status', ['pending', 'on_stage'])
          .order('requested_at', { ascending: true });
        
        if (error) throw error;
        
        // Fetch profiles for each request
        const requestsWithProfiles = await Promise.all(
          (data || []).map(async (req) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('id', req.user_id)
              .single();
            
            return { ...req, profile: profile || undefined } as StageRequest;
          })
        );
        
        setPendingRequests(requestsWithProfiles.filter(r => r.status === 'pending'));
        setOnStageUsers(requestsWithProfiles.filter(r => r.status === 'on_stage'));
      } else if (user) {
        // Fan sees only their own request
        const { data, error } = await supabase
          .from('live_stage_requests')
          .select('*')
          .eq('stream_id', streamId)
          .eq('user_id', user.id)
          .in('status', ['pending', 'approved', 'on_stage'])
          .maybeSingle();
        
        if (error) throw error;
        setMyRequest(data as StageRequest | null);
      }
    } catch (error) {
      console.error('Error fetching stage requests:', error);
    } finally {
      setIsLoading(false);
    }
  }, [streamId, isArtist, user]);

  // Subscribe to realtime updates
  useEffect(() => {
    fetchRequests();

    const channel = supabase
      .channel(`stage_requests:${streamId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_stage_requests',
          filter: `stream_id=eq.${streamId}`,
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId, fetchRequests]);

  // Fan: Raise hand (create request)
  const raiseHand = useCallback(async () => {
    if (!user || !streamId) return;
    
    try {
      const { error } = await supabase
        .from('live_stage_requests')
        .insert({
          stream_id: streamId,
          user_id: user.id,
          status: 'pending',
        });
      
      if (error) throw error;
      
      toast({
        title: "Hand raised!",
        description: "Waiting for artist approval to join stage.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to raise hand",
        variant: "destructive",
      });
    }
  }, [user, streamId, toast]);

  // Fan: Lower hand (delete pending request)
  const lowerHand = useCallback(async () => {
    if (!user || !myRequest) return;
    
    try {
      const { error } = await supabase
        .from('live_stage_requests')
        .delete()
        .eq('id', myRequest.id)
        .eq('status', 'pending');
      
      if (error) throw error;
      setMyRequest(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to lower hand",
        variant: "destructive",
      });
    }
  }, [user, myRequest, toast]);

  // Artist: Approve request
  const approveRequest = useCallback(async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('live_stage_requests')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
        })
        .eq('id', requestId);
      
      if (error) throw error;
      
      toast({
        title: "Request approved",
        description: "Fan can now join the stage.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve request",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Artist: Deny request
  const denyRequest = useCallback(async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('live_stage_requests')
        .update({
          status: 'denied',
          denied_at: new Date().toISOString(),
        })
        .eq('id', requestId);
      
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to deny request",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Artist: Kick from stage
  const kickFromStage = useCallback(async (requestId: string, reason?: string) => {
    try {
      const { error } = await supabase
        .from('live_stage_requests')
        .update({
          status: 'kicked',
          kicked_at: new Date().toISOString(),
          kick_reason: reason,
        })
        .eq('id', requestId);
      
      if (error) throw error;
      
      toast({
        title: "User removed",
        description: "Fan has been removed from stage.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to kick user",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Artist: Panic close all (emergency)
  const panicCloseAll = useCallback(async () => {
    try {
      // Kick everyone on stage
      await supabase
        .from('live_stage_requests')
        .update({
          status: 'kicked',
          kicked_at: new Date().toISOString(),
          kick_reason: 'Emergency close',
        })
        .eq('stream_id', streamId)
        .eq('status', 'on_stage');
      
      // Deny all pending
      await supabase
        .from('live_stage_requests')
        .update({
          status: 'denied',
          denied_at: new Date().toISOString(),
        })
        .eq('stream_id', streamId)
        .eq('status', 'pending');
      
      toast({
        title: "Stage cleared",
        description: "All fans have been removed and requests denied.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to clear stage",
        variant: "destructive",
      });
    }
  }, [streamId, toast]);

  return {
    pendingRequests,
    onStageUsers,
    myRequest,
    isLoading,
    raiseHand,
    lowerHand,
    approveRequest,
    denyRequest,
    kickFromStage,
    panicCloseAll,
  };
}
