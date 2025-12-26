import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface BrandMessage {
  id: string;
  sender_user_id: string;
  recipient_user_id: string;
  collab_entity_id: string | null;
  artist_id: string | null;
  application_id: string | null;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
  sender_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  recipient_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  artist_profile?: {
    artist_name: string;
    avatar_url: string | null;
  };
}

export interface Conversation {
  partnerId: string;
  partnerName: string;
  partnerAvatar: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  artistId?: string;
}

export function useBrandMessages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<BrandMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadMessages();
    }
  }, [user]);

  const loadMessages = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("brand_messages")
        .select("*")
        .or(`sender_user_id.eq.${user.id},recipient_user_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get unique user IDs for profile fetching
      const userIds = new Set<string>();
      const artistIds = new Set<string>();
      
      data?.forEach((msg) => {
        userIds.add(msg.sender_user_id);
        userIds.add(msg.recipient_user_id);
        if (msg.artist_id) artistIds.add(msg.artist_id);
      });

      // Fetch profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", Array.from(userIds));

      const { data: artistProfiles } = await supabase
        .from("artist_profiles")
        .select("id, artist_name, avatar_url, user_id")
        .in("id", Array.from(artistIds));

      const profileMap = new Map(profiles?.map((p) => [p.id, p]));
      const artistMap = new Map(artistProfiles?.map((a) => [a.id, a]));

      // Enrich messages with profile data
      const enrichedMessages = data?.map((msg) => ({
        ...msg,
        sender_profile: profileMap.get(msg.sender_user_id),
        recipient_profile: profileMap.get(msg.recipient_user_id),
        artist_profile: msg.artist_id ? artistMap.get(msg.artist_id) : undefined,
      })) || [];

      setMessages(enrichedMessages);

      // Build conversations
      const convMap = new Map<string, Conversation>();
      
      enrichedMessages.forEach((msg) => {
        const partnerId = msg.sender_user_id === user.id 
          ? msg.recipient_user_id 
          : msg.sender_user_id;
        
        const partnerProfile = msg.sender_user_id === user.id 
          ? msg.recipient_profile 
          : msg.sender_profile;

        const artistProfile = msg.artist_profile;
        
        if (!convMap.has(partnerId)) {
          convMap.set(partnerId, {
            partnerId,
            partnerName: artistProfile?.artist_name || partnerProfile?.full_name || "Unknown",
            partnerAvatar: artistProfile?.avatar_url || partnerProfile?.avatar_url || null,
            lastMessage: msg.message,
            lastMessageAt: msg.created_at,
            unreadCount: 0,
            artistId: msg.artist_id || undefined,
          });
        }

        if (!msg.is_read && msg.recipient_user_id === user.id) {
          const conv = convMap.get(partnerId)!;
          conv.unreadCount++;
        }
      });

      setConversations(Array.from(convMap.values()));
      setUnreadCount(enrichedMessages.filter((m) => !m.is_read && m.recipient_user_id === user.id).length);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (
    recipientUserId: string,
    message: string,
    options?: {
      subject?: string;
      artistId?: string;
      applicationId?: string;
      collabEntityId?: string;
    }
  ) => {
    if (!user) return false;

    try {
      const { error } = await supabase.from("brand_messages").insert({
        sender_user_id: user.id,
        recipient_user_id: recipientUserId,
        message,
        subject: options?.subject || null,
        artist_id: options?.artistId || null,
        application_id: options?.applicationId || null,
        collab_entity_id: options?.collabEntityId || null,
      });

      if (error) throw error;

      await loadMessages();
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      return false;
    }
  };

  const markAsRead = async (messageId: string) => {
    if (!user) return;

    try {
      await supabase
        .from("brand_messages")
        .update({ is_read: true })
        .eq("id", messageId)
        .eq("recipient_user_id", user.id);

      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, is_read: true } : m))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const getConversationMessages = (partnerId: string) => {
    return messages.filter(
      (m) => m.sender_user_id === partnerId || m.recipient_user_id === partnerId
    ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  };

  return {
    messages,
    conversations,
    unreadCount,
    loading,
    sendMessage,
    markAsRead,
    getConversationMessages,
    refresh: loadMessages,
  };
}
