import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface UseLiveStreamViewerOptions {
  streamId: string | null;
  artistUserId: string | null;
  enabled: boolean;
}

interface UseLiveStreamViewerReturn {
  remoteStream: MediaStream | null;
  connectionState: 'connecting' | 'connected' | 'failed' | 'disconnected';
  error: string | null;
  retry: () => void;
}

/**
 * useLiveStreamViewer - Fan receives the artist's stream via WebRTC P2P
 * 
 * Flow:
 * 1. Fan opens live page, sends "viewer_join" signal
 * 2. Waits for artist's offer
 * 3. Creates answer and sends it back
 * 4. Handles ICE candidates
 * 5. Receives remote stream and displays it
 */
export function useLiveStreamViewer({
  streamId,
  artistUserId,
  enabled,
}: UseLiveStreamViewerOptions): UseLiveStreamViewerReturn {
  const { user } = useAuth();
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'failed' | 'disconnected'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const hasJoinedRef = useRef(false);

  // ICE servers configuration
  const getIceServers = useCallback((): RTCIceServer[] => {
    return [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ];
  }, []);

  // Send viewer_join signal to artist
  const sendJoinSignal = useCallback(async () => {
    if (!user || !streamId || !artistUserId || hasJoinedRef.current) return;
    
    hasJoinedRef.current = true;
    setConnectionState('connecting');
    setError(null);

    console.log('Sending viewer_join to artist:', artistUserId);

    try {
      await supabase.from('webrtc_signals').insert({
        room_id: streamId,
        sender_id: user.id,
        target_id: artistUserId,
        signal_type: 'viewer_join',
        signal_data: { timestamp: Date.now() } as any,
      });
    } catch (err) {
      console.error('Failed to send viewer_join:', err);
      setError('Failed to connect to stream');
      setConnectionState('failed');
      hasJoinedRef.current = false;
    }
  }, [user, streamId, artistUserId]);

  // Create peer connection and handle offer
  const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit) => {
    if (!user || !streamId || !artistUserId) return;

    console.log('Received offer from artist');

    // Close existing connection if any
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection({
      iceServers: getIceServers(),
      iceCandidatePoolSize: 10,
    });

    peerConnectionRef.current = pc;

    // Handle ICE candidates
    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        try {
          await supabase.from('webrtc_signals').insert({
            room_id: streamId,
            sender_id: user.id,
            target_id: artistUserId,
            signal_type: 'ice-candidate',
            signal_data: event.candidate.toJSON() as any,
          });
        } catch (err) {
          console.error('Failed to send ICE candidate:', err);
        }
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('Received remote track');
      const stream = event.streams[0];
      setRemoteStream(stream);
    };

    // Track connection state
    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      switch (pc.connectionState) {
        case 'connected':
          setConnectionState('connected');
          setError(null);
          break;
        case 'failed':
          setConnectionState('failed');
          setError('Connection failed');
          break;
        case 'disconnected':
        case 'closed':
          setConnectionState('disconnected');
          break;
      }
    };

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Send answer back to artist
      await supabase.from('webrtc_signals').insert({
        room_id: streamId,
        sender_id: user.id,
        target_id: artistUserId,
        signal_type: 'answer',
        signal_data: answer as any,
      });
      
      console.log('Sent answer to artist');
    } catch (err) {
      console.error('Failed to handle offer:', err);
      setError('Failed to establish connection');
      setConnectionState('failed');
    }
  }, [user, streamId, artistUserId, getIceServers]);

  // Handle incoming ICE candidate
  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    if (!peerConnectionRef.current) return;

    try {
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error('Failed to add ICE candidate:', err);
    }
  }, []);

  // Retry connection
  const retry = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setRemoteStream(null);
    hasJoinedRef.current = false;
    sendJoinSignal();
  }, [sendJoinSignal]);

  // Close connection
  const closeConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setRemoteStream(null);
    setConnectionState('disconnected');
    hasJoinedRef.current = false;
  }, []);

  // Subscribe to incoming signals and join stream
  useEffect(() => {
    if (!user || !streamId || !artistUserId || !enabled) {
      closeConnection();
      return;
    }

    // Send join signal
    sendJoinSignal();
    
    // Set up timeout - if no connection after 15 seconds, show retry option
    const timeout = setTimeout(() => {
      if (connectionState === 'connecting') {
        console.log('[Viewer] Connection timeout - no offer received');
        setError('Connection timed out. The artist may not be streaming yet.');
        setConnectionState('failed');
      }
    }, 15000);

    const channel = supabase
      .channel(`viewer:${streamId}:${user.id}`)
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
          
          console.log('[Viewer] Received signal:', signal.signal_type, 'from:', signal.sender_id);
          
          // Only process signals for our stream
          if (signal.room_id !== streamId) return;
          
          // Only process signals intended for us
          if (signal.target_id !== user.id) return;
          
          // Only process signals from the artist
          if (signal.sender_id !== artistUserId) return;
          
          switch (signal.signal_type) {
            case 'offer':
              console.log('[Viewer] Processing offer from artist');
              await handleOffer(signal.signal_data);
              break;
            case 'ice-candidate':
              await handleIceCandidate(signal.signal_data);
              break;
          }
        }
      )
      .subscribe();

    return () => {
      clearTimeout(timeout);
      supabase.removeChannel(channel);
      closeConnection();
    };
  }, [user, streamId, artistUserId, enabled, sendJoinSignal, handleOffer, handleIceCandidate, closeConnection, connectionState]);

  return {
    remoteStream,
    connectionState,
    error,
    retry,
  };
}
