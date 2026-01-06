import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface PresenceUser {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  joinedAt: string;
  isArtist?: boolean;
}

interface CommunityPresence {
  onlineUsers: PresenceUser[];
  totalOnline: number;
  isConnected: boolean;
  artistOnline: boolean;
}

export function useCommunityPresence(
  communityId: string | null,
  artistUserId?: string | null
): CommunityPresence {
  const { user, profile } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const formatPresenceState = useCallback((state: Record<string, unknown[]>): PresenceUser[] => {
    const users: PresenceUser[] = [];
    const seenIds = new Set<string>();

    Object.values(state).forEach((presences) => {
      presences.forEach((presence: unknown) => {
        const p = presence as { user_id?: string; display_name?: string; avatar_url?: string; online_at?: string; is_artist?: boolean };
        if (p.user_id && !seenIds.has(p.user_id)) {
          seenIds.add(p.user_id);
          users.push({
            id: p.user_id,
            displayName: p.display_name || 'Anonymous',
            avatarUrl: p.avatar_url || null,
            joinedAt: p.online_at || new Date().toISOString(),
            isArtist: p.is_artist || false,
          });
        }
      });
    });

    // Sort: artist first, then by join time
    return users.sort((a, b) => {
      if (a.isArtist && !b.isArtist) return -1;
      if (!a.isArtist && b.isArtist) return 1;
      return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
    });
  }, []);

  // Fetch user's avatar
  useEffect(() => {
    if (!user?.id) return;
    
    const fetchAvatar = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .maybeSingle();
      
      setUserAvatar(data?.avatar_url || null);
    };
    
    fetchAvatar();
  }, [user?.id]);

  useEffect(() => {
    if (!communityId || !user?.id) {
      setOnlineUsers([]);
      setIsConnected(false);
      return;
    }

    const channelName = `community_presence:${communityId}`;
    const channel = supabase.channel(channelName);
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnlineUsers(formatPresenceState(state));
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('User left:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          
          // Track this user's presence
          const isArtist = artistUserId === user.id;
          await channel.track({
            user_id: user.id,
            display_name: profile?.full_name || 'Anonymous',
            avatar_url: userAvatar,
            online_at: new Date().toISOString(),
            is_artist: isArtist,
          });
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsConnected(false);
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [communityId, user?.id, profile?.full_name, userAvatar, artistUserId, formatPresenceState]);

  const artistOnline = onlineUsers.some(u => u.isArtist);

  return {
    onlineUsers,
    totalOnline: onlineUsers.length,
    isConnected,
    artistOnline,
  };
}
