import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TURNConfig {
  urls: string;
  username: string;
  credential: string;
}

interface UseWebRTCOptions {
  roomId: string;
  role: 'host' | 'participant';
  targetId: string;
  turnConfig?: TURNConfig;
  onRemoteStream?: (stream: MediaStream, peerId: string) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
}

interface UseWebRTCReturn {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  connectionState: RTCPeerConnectionState | null;
  isConnecting: boolean;
  error: string | null;
  startLocalStream: (constraints?: MediaStreamConstraints) => Promise<MediaStream | null>;
  createOffer: () => Promise<void>;
  createAnswer: (offer: RTCSessionDescriptionInit) => Promise<void>;
  addIceCandidate: (candidate: RTCIceCandidateInit) => Promise<void>;
  closeConnection: () => void;
}

/**
 * useWebRTC - WebRTC hook for interactive features ONLY
 * Per SUPER CARD: WebRTC is reserved for interaction only (Fan-on-Stage, Backstage, Co-host)
 * 
 * IMPORTANT:
 * - targetId is REQUIRED (no broadcast signaling)
 * - TURN server configuration is MANDATORY for production
 */
export function useWebRTC({
  roomId,
  role,
  targetId,
  turnConfig,
  onRemoteStream,
  onConnectionStateChange,
}: UseWebRTCOptions): UseWebRTCReturn {
  const { user } = useAuth();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // ICE servers configuration
  const getIceServers = useCallback((): RTCIceServer[] => {
    const servers: RTCIceServer[] = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ];
    
    // Add TURN server if configured (MANDATORY per SUPER CARD)
    if (turnConfig?.urls) {
      servers.push({
        urls: turnConfig.urls,
        username: turnConfig.username,
        credential: turnConfig.credential,
      });
    }
    
    return servers;
  }, [turnConfig]);

  // Create and configure peer connection
  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection({
      iceServers: getIceServers(),
      iceCandidatePoolSize: 10,
    });

    // Handle ICE candidates - send via Supabase signaling
    pc.onicecandidate = async (event) => {
      if (event.candidate && user) {
        try {
          await supabase.from('webrtc_signals').insert({
            room_id: roomId,
            sender_id: user.id,
            target_id: targetId, // REQUIRED per SUPER CARD
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
      const stream = event.streams[0];
      setRemoteStream(stream);
      onRemoteStream?.(stream, targetId);
    };

    // Track connection state
    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
      onConnectionStateChange?.(pc.connectionState);
      
      if (pc.connectionState === 'failed') {
        setError('Connection failed');
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [roomId, targetId, user, getIceServers, onRemoteStream, onConnectionStateChange]);

  // Start local media stream
  const startLocalStream = useCallback(async (
    constraints: MediaStreamConstraints = { video: true, audio: true }
  ): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      setError('Failed to access camera/microphone');
      console.error('getUserMedia error:', err);
      return null;
    }
  }, []);

  // Create and send offer (for host)
  const createOffer = useCallback(async () => {
    if (!user) return;
    setIsConnecting(true);
    setError(null);

    try {
      const pc = createPeerConnection();
      
      // Add local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send offer via Supabase signaling
      await supabase.from('webrtc_signals').insert({
        room_id: roomId,
        sender_id: user.id,
        target_id: targetId,
        signal_type: 'offer',
        signal_data: offer as any,
      });
    } catch (err) {
      setError('Failed to create offer');
      console.error('createOffer error:', err);
    } finally {
      setIsConnecting(false);
    }
  }, [user, roomId, targetId, createPeerConnection]);

  // Create and send answer (for participant)
  const createAnswer = useCallback(async (offer: RTCSessionDescriptionInit) => {
    if (!user) return;
    setIsConnecting(true);
    setError(null);

    try {
      const pc = createPeerConnection();
      
      // Add local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Send answer via Supabase signaling
      await supabase.from('webrtc_signals').insert({
        room_id: roomId,
        sender_id: user.id,
        target_id: targetId,
        signal_type: 'answer',
        signal_data: answer as any,
      });
    } catch (err) {
      setError('Failed to create answer');
      console.error('createAnswer error:', err);
    } finally {
      setIsConnecting(false);
    }
  }, [user, roomId, targetId, createPeerConnection]);

  // Add ICE candidate
  const addIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (err) {
      console.error('Failed to add ICE candidate:', err);
    }
  }, []);

  // Close connection and cleanup
  const closeConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    setLocalStream(null);
    setRemoteStream(null);
    setConnectionState(null);
    setIsConnecting(false);
    setError(null);
  }, []);

  // Subscribe to incoming signals
  useEffect(() => {
    if (!user || !roomId) return;

    const channel = supabase
      .channel(`webrtc_signals:${roomId}:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'webrtc_signals',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const signal = payload.new as {
            sender_id: string;
            target_id: string;
            signal_type: string;
            signal_data: any;
          };
          
          // Only process signals intended for us
          if (signal.target_id !== user.id) return;
          
          switch (signal.signal_type) {
            case 'offer':
              if (role === 'participant') {
                await createAnswer(signal.signal_data);
              }
              break;
            case 'answer':
              if (peerConnectionRef.current) {
                await peerConnectionRef.current.setRemoteDescription(
                  new RTCSessionDescription(signal.signal_data)
                );
              }
              break;
            case 'ice-candidate':
              await addIceCandidate(signal.signal_data);
              break;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, roomId, role, createAnswer, addIceCandidate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      closeConnection();
    };
  }, [closeConnection]);

  return {
    localStream,
    remoteStream,
    connectionState,
    isConnecting,
    error,
    startLocalStream,
    createOffer,
    createAnswer,
    addIceCandidate,
    closeConnection,
  };
}
