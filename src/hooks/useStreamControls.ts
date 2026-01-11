import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StreamControlsState {
  isMuted: boolean;
  isCameraOff: boolean;
  isPaused: boolean;
  isEnding: boolean;
}

export const useStreamControls = (
  streamId: string | null,
  localStream?: MediaStream | null
) => {
  const [state, setState] = useState<StreamControlsState>({
    isMuted: false,
    isCameraOff: false,
    isPaused: false,
    isEnding: false,
  });

  const toggleMute = useCallback(() => {
    // Toggle actual audio tracks if local stream exists
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      const newMutedState = !state.isMuted;
      audioTracks.forEach((track) => {
        track.enabled = !newMutedState;
      });
    }

    setState(prev => {
      const newMuted = !prev.isMuted;
      toast.info(newMuted ? "Microphone muted" : "Microphone unmuted");
      return { ...prev, isMuted: newMuted };
    });
  }, [localStream, state.isMuted]);

  const toggleCamera = useCallback(() => {
    // Toggle actual video tracks if local stream exists
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      const newCameraOffState = !state.isCameraOff;
      videoTracks.forEach((track) => {
        track.enabled = !newCameraOffState;
      });
    }

    setState(prev => {
      const newCameraOff = !prev.isCameraOff;
      toast.info(newCameraOff ? "Camera off" : "Camera on");
      return { ...prev, isCameraOff: newCameraOff };
    });
  }, [localStream, state.isCameraOff]);

  const pauseStream = useCallback(async () => {
    if (!streamId) return;
    
    try {
      const { error } = await supabase
        .from("artist_live_streams")
        .update({ is_paused: true })
        .eq("id", streamId);

      if (error) throw error;

      setState(prev => ({ ...prev, isPaused: true }));
      toast.info("Stream paused - viewers see a pause screen");
    } catch (err) {
      console.error("Error pausing stream:", err);
      toast.error("Failed to pause stream");
    }
  }, [streamId]);

  const resumeStream = useCallback(async () => {
    if (!streamId) return;
    
    try {
      const { error } = await supabase
        .from("artist_live_streams")
        .update({ is_paused: false })
        .eq("id", streamId);

      if (error) throw error;

      setState(prev => ({ ...prev, isPaused: false }));
      toast.success("Stream resumed");
    } catch (err) {
      console.error("Error resuming stream:", err);
      toast.error("Failed to resume stream");
    }
  }, [streamId]);

  const endStream = useCallback(async () => {
    if (!streamId) return;
    
    setState(prev => ({ ...prev, isEnding: true }));
    
    try {
      const { error } = await supabase
        .from("artist_live_streams")
        .update({ 
          status: "ended",
          ended_at: new Date().toISOString()
        })
        .eq("id", streamId);

      if (error) throw error;

      toast.success("Stream ended");
      return true;
    } catch (err) {
      console.error("Error ending stream:", err);
      toast.error("Failed to end stream");
      setState(prev => ({ ...prev, isEnding: false }));
      return false;
    }
  }, [streamId]);

  return {
    ...state,
    toggleMute,
    toggleCamera,
    pauseStream,
    resumeStream,
    endStream,
  };
};
