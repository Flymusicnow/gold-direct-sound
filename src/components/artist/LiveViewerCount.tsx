import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users } from "lucide-react";

interface LiveViewerCountProps {
  streamId: string;
}

export function LiveViewerCount({ streamId }: LiveViewerCountProps) {
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    const channel = supabase.channel(`stream_presence:${streamId}`);

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const count = Object.keys(state).length;
        setViewerCount(count);
        
        // Update viewer count in database
        updateViewerCount(count);
      })
      .on("presence", { event: "join" }, () => {
        const state = channel.presenceState();
        setViewerCount(Object.keys(state).length);
      })
      .on("presence", { event: "leave" }, () => {
        const state = channel.presenceState();
        setViewerCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId]);

  const updateViewerCount = async (count: number) => {
    try {
      await supabase
        .from("artist_live_streams")
        .update({ viewer_count: count })
        .eq("id", streamId);
    } catch (error) {
      console.error("Error updating viewer count:", error);
    }
  };

  return (
    <div className="flex items-center gap-2 bg-black/80 px-4 py-2 rounded-lg">
      <Users className="h-5 w-5 text-red-500" />
      <span className="text-white font-semibold">{viewerCount}</span>
      <span className="text-white/70 text-sm">watching</span>
    </div>
  );
}
