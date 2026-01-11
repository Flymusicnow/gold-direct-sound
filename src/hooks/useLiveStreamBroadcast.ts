import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PeerConnection {
  peerId: string;
  pc: RTCPeerConnection;
  connectionState: RTCPeerConnectionState;
}

interface UseLiveStreamBroadcastOptions {
  streamId: string | null;
  localStream: MediaStream | null;
  enabled: boolean;
}

interface UseLiveStreamBroadcastReturn {
  connectedViewers: number;
  isActive: boolean;
  error: string | null;
}

/**
 * useLiveStreamBroadcast - Artist broadcasts their local stream to multiple viewers via WebRTC P2P
 * 
 * Flow:
 * 1. Artist goes live with localStream
 * 2. Hook listens for "viewer_join" signals
 * 3. For each viewer, creates offer and sends it
 * 4. Handles answer and ICE candidates
 * 5. Streams video to all connected peers
 */
export function useLiveStreamBroadcast({
  streamId,
  localStream,
  enabled,
}: UseLiveStreamBroadcastOptions): UseLiveStreamBroadcastReturn {
  const { user } = useAuth();
  const [connectedViewers, setConnectedViewers] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const peersRef = useRef<Map<string, PeerConnection>>(new Map());

  // ICE servers configuration
  const getIceServers = useCallback((): RTCIceServer[] => {
    return [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ];
  }, []);

  // Create peer connection for a specific viewer
  const createPeerForViewer = useCallback(async (viewerId: string) => {
    if (!user || !localStream || !streamId) return;
    
    // Check if we already have a connection to this viewer
    if (peersRef.current.has(viewerId)) {
      console.log('Already connected to viewer:', viewerId);
      return;
    }

    console.log('Creating peer connection for viewer:', viewerId);

    const pc = new RTCPeerConnection({
      iceServers: getIceServers(),
      iceCandidatePoolSize: 10,
    });

    // Add local tracks to the connection
    localStream.getTracks().forEach(track => {
      pc.addTrack(track, localStream);
    });

    // Handle ICE candidates - send to the specific viewer
    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        try {
          await supabase.from('webrtc_signals').insert({
            room_id: streamId,
            sender_id: user.id,
            target_id: viewerId,
            signal_type: 'ice-candidate',
            signal_data: event.candidate.toJSON() as any,
          });
        } catch (err) {
          console.error('Failed to send ICE candidate:', err);
        }
      }
    };

    // Track connection state
    pc.onconnectionstatechange = () => {
      const peerEntry = peersRef.current.get(viewerId);
      if (peerEntry) {
        peerEntry.connectionState = pc.connectionState;
        
        // Update connected count
        const connected = Array.from(peersRef.current.values()).filter(
          p => p.connectionState === 'connected'
        ).length;
        setConnectedViewers(connected);
        
        // Clean up failed/closed connections
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          console.log('Removing disconnected peer:', viewerId);
          peersRef.current.delete(viewerId);
          pc.close();
        }
      }
    };

    // Store the peer connection
    peersRef.current.set(viewerId, {
      peerId: viewerId,
      pc,
      connectionState: 'new',
    });

    // Create and send offer
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await supabase.from('webrtc_signals').insert({
        room_id: streamId,
        sender_id: user.id,
        target_id: viewerId,
        signal_type: 'offer',
        signal_data: offer as any,
      });
      
      console.log('Sent offer to viewer:', viewerId);
    } catch (err) {
      console.error('Failed to create offer:', err);
      peersRef.current.delete(viewerId);
      pc.close();
    }
  }, [user, localStream, streamId, getIceServers]);

  // Handle incoming answer from viewer
  const handleAnswer = useCallback(async (viewerId: string, answer: RTCSessionDescriptionInit) => {
    const peerEntry = peersRef.current.get(viewerId);
    if (!peerEntry) {
      console.warn('No peer connection for answer from:', viewerId);
      return;
    }

    try {
      await peerEntry.pc.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('Set remote description for viewer:', viewerId);
    } catch (err) {
      console.error('Failed to set remote description:', err);
    }
  }, []);

  // Handle incoming ICE candidate from viewer
  const handleIceCandidate = useCallback(async (viewerId: string, candidate: RTCIceCandidateInit) => {
    const peerEntry = peersRef.current.get(viewerId);
    if (!peerEntry) return;

    try {
      await peerEntry.pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error('Failed to add ICE candidate:', err);
    }
  }, []);

  // Close all peer connections
  const closeAllConnections = useCallback(() => {
    peersRef.current.forEach((peer) => {
      peer.pc.close();
    });
    peersRef.current.clear();
    setConnectedViewers(0);
    setIsActive(false);
  }, []);

  // Subscribe to incoming signals (viewer_join, answer, ice-candidate)
  useEffect(() => {
    if (!user || !streamId || !enabled || !localStream) {
      closeAllConnections();
      return;
    }

    setIsActive(true);
    console.log('[Broadcast] Artist broadcast active, listening for viewers on stream:', streamId);

    const channel = supabase
      .channel(`broadcast:${streamId}:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'webrtc_signals',
        },
        async (payload) => {
          const signal = payload.new as {
            room_id: string;
            sender_id: string;
            target_id: string;
            signal_type: string;
            signal_data: any;
          };
          
          console.log('[Broadcast] Received signal:', signal.signal_type, 'from:', signal.sender_id, 'room:', signal.room_id);
          
          // Only process signals for our stream
          if (signal.room_id !== streamId) return;
          
          // Don't process our own signals
          if (signal.sender_id === user.id) return;
          
          // Only process signals intended for us (the artist)
          if (signal.target_id !== user.id) {
            console.log('[Broadcast] Signal not for us, target:', signal.target_id);
            return;
          }
          
          switch (signal.signal_type) {
            case 'viewer_join':
              // New viewer wants to connect
              console.log('[Broadcast] New viewer joining:', signal.sender_id);
              await createPeerForViewer(signal.sender_id);
              break;
            case 'answer':
              // Viewer responded to our offer
              await handleAnswer(signal.sender_id, signal.signal_data);
              break;
            case 'ice-candidate':
              // ICE candidate from viewer
              await handleIceCandidate(signal.sender_id, signal.signal_data);
              break;
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up broadcast');
      supabase.removeChannel(channel);
      closeAllConnections();
    };
  }, [user, streamId, enabled, localStream, createPeerForViewer, handleAnswer, handleIceCandidate, closeAllConnections]);

  return {
    connectedViewers,
    isActive,
    error,
  };
}
