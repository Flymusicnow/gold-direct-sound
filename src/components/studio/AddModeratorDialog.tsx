import React, { useState, useEffect } from 'react';
import { Search, Crown, Star } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { type ModeratorPermissions } from '@/hooks/useCommunityModerator';

interface Fan {
  id: string;
  name: string;
  avatarUrl: string | null;
  isSupporter: boolean;
  tier?: string;
}

interface AddModeratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string | null;
  artistId?: string; // Fallback for direct artist-based lookup
  currentUserId: string;
  existingModeratorIds: string[];
  onAdd: (userId: string, permissions: ModeratorPermissions) => void;
}

const DEFAULT_PERMISSIONS: ModeratorPermissions = {
  canHideComments: true,
  canPinComments: true,
  canHidePosts: false,
  canPinPosts: false,
};

export const AddModeratorDialog: React.FC<AddModeratorDialogProps> = ({
  open,
  onOpenChange,
  communityId,
  artistId,
  currentUserId,
  existingModeratorIds,
  onAdd,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [fans, setFans] = useState<Fan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFan, setSelectedFan] = useState<Fan | null>(null);
  const [permissions, setPermissions] = useState<ModeratorPermissions>(DEFAULT_PERMISSIONS);

  // Fetch fans when dialog opens
  useEffect(() => {
    if (!open) return;
    // Need either communityId or artistId
    if (!communityId && !artistId) return;

    async function fetchFans() {
      setIsLoading(true);
      try {
        let targetArtistId = artistId;

        // If we have communityId but no artistId, get artist_id from community
        if (communityId && !targetArtistId) {
          const { data: community } = await supabase
            .from('communities')
            .select('artist_id')
            .eq('id', communityId)
            .single();

          if (!community) {
            setFans([]);
            setIsLoading(false);
            return;
          }
          targetArtistId = community.artist_id;
        }

        if (!targetArtistId) {
          setFans([]);
          setIsLoading(false);
          return;
        }

        // Fetch followers
        const { data: followers } = await supabase
          .from('follows')
          .select('fan_id')
          .eq('artist_id', targetArtistId);

        const fanIds = (followers || []).map((f) => f.fan_id);

        if (fanIds.length === 0) {
          setFans([]);
          setIsLoading(false);
          return;
        }

        // Fetch profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, email')
          .in('id', fanIds);

        // Fetch supporter subscriptions
        const { data: subscriptions } = await supabase
          .from('supporter_subscriptions')
          .select('fan_user_id, tier')
          .eq('artist_id', targetArtistId)
          .eq('status', 'active');

        const supporterMap = new Map(
          (subscriptions || []).map((s) => [s.fan_user_id, s.tier])
        );

        const mappedFans: Fan[] = (profiles || [])
          .filter((p) => !existingModeratorIds.includes(p.id) && p.id !== currentUserId)
          .map((p) => ({
            id: p.id,
            name: p.full_name || p.email?.split('@')[0] || 'Fan',
            avatarUrl: p.avatar_url,
            isSupporter: supporterMap.has(p.id),
            tier: supporterMap.get(p.id),
          }))
          // Sort supporters first
          .sort((a, b) => {
            if (a.isSupporter && !b.isSupporter) return -1;
            if (!a.isSupporter && b.isSupporter) return 1;
            return a.name.localeCompare(b.name);
          });

        setFans(mappedFans);
      } catch (error) {
        console.error('Error fetching fans:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFans();
  }, [open, communityId, artistId, currentUserId, existingModeratorIds]);

  // Filter fans by search query
  const filteredFans = fans.filter((fan) =>
    fan.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (fan: Fan) => {
    setSelectedFan(fan);
  };

  const handleAdd = () => {
    if (selectedFan) {
      onAdd(selectedFan.id, permissions);
      setSelectedFan(null);
      setPermissions(DEFAULT_PERMISSIONS);
      setSearchQuery('');
    }
  };

  const handleClose = () => {
    setSelectedFan(null);
    setPermissions(DEFAULT_PERMISSIONS);
    setSearchQuery('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Moderator</DialogTitle>
          <DialogDescription>
            Select a fan to give moderation permissions
          </DialogDescription>
        </DialogHeader>

        {!selectedFan ? (
          <>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search fans..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Fan list */}
            <ScrollArea className="h-64">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading fans...
                </div>
              ) : filteredFans.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No fans found' : 'No fans to add as moderators'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFans.map((fan) => (
                    <button
                      key={fan.id}
                      onClick={() => handleSelect(fan)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={fan.avatarUrl || undefined} />
                        <AvatarFallback>{fan.name[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium truncate block">{fan.name}</span>
                        {fan.isSupporter && (
                          <Badge variant="outline" className="text-xs mt-0.5 bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                            <Star className="h-3 w-3 mr-1" />
                            {fan.tier || 'Supporter'}
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </>
        ) : (
          <>
            {/* Selected fan + permissions */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <Avatar className="h-12 w-12">
                <AvatarImage src={selectedFan.avatarUrl || undefined} />
                <AvatarFallback>{selectedFan.name[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <span className="font-medium">{selectedFan.name}</span>
                {selectedFan.isSupporter && (
                  <Badge variant="outline" className="ml-2 text-xs bg-yellow-500/10 text-yellow-600">
                    <Star className="h-3 w-3 mr-1" />
                    Supporter
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Permissions</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="perm-hide-comments">Can hide comments</Label>
                  <Switch
                    id="perm-hide-comments"
                    checked={permissions.canHideComments}
                    onCheckedChange={(checked) =>
                      setPermissions({ ...permissions, canHideComments: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="perm-pin-comments">Can pin comments</Label>
                  <Switch
                    id="perm-pin-comments"
                    checked={permissions.canPinComments}
                    onCheckedChange={(checked) =>
                      setPermissions({ ...permissions, canPinComments: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="perm-hide-posts">Can hide posts</Label>
                  <Switch
                    id="perm-hide-posts"
                    checked={permissions.canHidePosts}
                    onCheckedChange={(checked) =>
                      setPermissions({ ...permissions, canHidePosts: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="perm-pin-posts">Can pin posts</Label>
                  <Switch
                    id="perm-pin-posts"
                    checked={permissions.canPinPosts}
                    onCheckedChange={(checked) =>
                      setPermissions({ ...permissions, canPinPosts: checked })
                    }
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedFan(null)}>
                Back
              </Button>
              <Button onClick={handleAdd}>Add Moderator</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
