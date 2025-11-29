import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Heart, Sparkles, Flame, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  is_artist: boolean;
  created_at: string;
  profiles?: {
    full_name?: string;
  };
  supporter_level?: string;
}

interface Gift {
  id: string;
  gift_type: string;
  sender_name: string;
  created_at: string;
}

interface LiveChatPanelProps {
  streamId: string;
  isArtist?: boolean;
  artistId: string;
}

export function LiveChatPanel({ streamId, isArtist = false, artistId }: LiveChatPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    subscribeToMessages();
    subscribeToGifts();
  }, [streamId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, gifts]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("live_stream_chat")
        .select("*")
        .eq("stream_id", streamId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) throw error;

      // Fetch profile data and supporter level for each message
      const messagesWithProfiles = await Promise.all(
        (data || []).map(async (msg) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", msg.user_id)
            .single();
          
          // Get supporter level
          const { data: supportScore } = await supabase
            .from("fan_support_scores")
            .select("level")
            .eq("fan_user_id", msg.user_id)
            .eq("artist_id", artistId)
            .maybeSingle();
          
          return {
            ...msg,
            profiles: profile || { full_name: undefined },
            supporter_level: supportScore?.level || 'none',
          };
        })
      );

      setMessages(messagesWithProfiles);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`live_stream_chat:${streamId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_stream_chat",
          filter: `stream_id=eq.${streamId}`,
        },
        async (payload) => {
          const newMsg = payload.new as ChatMessage;
          
          // Fetch profile and supporter level for new message
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", newMsg.user_id)
            .maybeSingle();
          
          const { data: supportScore } = await supabase
            .from("fan_support_scores")
            .select("level")
            .eq("fan_user_id", newMsg.user_id)
            .eq("artist_id", artistId)
            .maybeSingle();
          
          setMessages((prev) => [
            ...prev,
            {
              ...newMsg,
              profiles: profile || { full_name: undefined },
              supporter_level: supportScore?.level || 'none',
            },
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToGifts = () => {
    const channel = supabase
      .channel(`live_gifts:${streamId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_gifts",
          filter: `stream_id=eq.${streamId}`,
        },
        async (payload) => {
          const newGift = payload.new;
          
          // Fetch sender name
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", newGift.sender_user_id)
            .maybeSingle();
          
          const gift: Gift = {
            id: newGift.id,
            gift_type: newGift.gift_type,
            sender_name: profile?.full_name || 'Anonymous',
            created_at: newGift.created_at,
          };
          
          setGifts((prev) => [...prev, gift]);
          
          // Remove gift message after 5 seconds
          setTimeout(() => {
            setGifts((prev) => prev.filter((g) => g.id !== gift.id));
          }, 5000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      const { error } = await supabase.from("live_stream_chat").insert({
        stream_id: streamId,
        user_id: user.id,
        message: newMessage.trim(),
        is_artist: isArtist,
      });

      if (error) throw error;
      setNewMessage("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const giftIcons = {
    heart: Heart,
    gold_sparkle: Sparkles,
    fire: Flame,
    star: Star,
  };

  return (
    <div className="flex flex-col h-full bg-card/50 border border-border/50 rounded-lg">
      <div className="p-4 border-b border-border/50">
        <h3 className="font-semibold">Live Chat</h3>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-3">
          {messages.map((msg) => {
            const supporterColor =
              msg.supporter_level === 'gold'
                ? 'text-primary'
                : msg.supporter_level === 'silver'
                ? 'text-gray-400'
                : msg.supporter_level === 'bronze'
                ? 'text-orange-600'
                : '';

            return (
              <div key={msg.id} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold text-sm ${supporterColor}`}>
                    {msg.profiles?.full_name || "Fan"}
                  </span>
                  {msg.is_artist && (
                    <Badge className="bg-primary text-primary-foreground text-xs">
                      Artist
                    </Badge>
                  )}
                  {msg.supporter_level !== 'none' && (
                    <Badge variant="outline" className="text-xs">
                      {msg.supporter_level}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(msg.created_at), "HH:mm")}
                  </span>
                </div>
                <p className="text-sm text-foreground">{msg.message}</p>
              </div>
            );
          })}

          {/* Gift messages */}
          {gifts.map((gift) => {
            const GiftIcon = giftIcons[gift.gift_type as keyof typeof giftIcons];
            return (
              <div
                key={gift.id}
                className="p-2 bg-primary/10 rounded-lg border border-primary/20 animate-in fade-in slide-in-from-bottom-2"
              >
                <div className="flex items-center gap-2 text-sm">
                  <GiftIcon className="h-4 w-4 text-primary" />
                  <span className="font-semibold">{gift.sender_name}</span>
                  <span className="text-muted-foreground">sent a {gift.gift_type}</span>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {user ? (
        <form onSubmit={handleSendMessage} className="p-4 border-t border-border/50">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Send a message..."
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      ) : (
        <div className="p-4 border-t border-border/50 text-center text-sm text-muted-foreground">
          Sign in to chat
        </div>
      )}
    </div>
  );
}
