import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, UserPlus, Share2, Eye, MoreHorizontal, Play, Flag } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { GlobalFeedItem } from "@/hooks/useGlobalFeed";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { CommentsPanel } from "@/components/community/CommentsPanel";

interface GlobalFeedCardProps {
  item: GlobalFeedItem;
  index: number;
  followedArtistIds: Set<string>;
  onFollow: (artistId: string) => void;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function GlobalFeedCard({ item, index, followedArtistIds, onFollow }: GlobalFeedCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reacted, setReacted] = useState(false);
  const [reactionCount, setReactionCount] = useState(item.reactionCount ?? item.likeCount ?? 0);
  const [isFollowing, setIsFollowing] = useState(followedArtistIds.has(item.artistId));
  const [commentsOpen, setCommentsOpen] = useState(false);
  const rawPostId = item.id.replace('post_', '');

  const timeAgo = formatDistanceToNow(new Date(item.createdAt), { addSuffix: true });
  const initials = item.artistName.slice(0, 2).toUpperCase();

  const handleReact = async () => {
    if (!user) return;
    setReacted(true);
    setReactionCount(c => c + 1);
    // No-op API call for Wave 1 — just optimistic UI
  };

  const handleFollow = async () => {
    if (!user) { navigate('/signin/fan'); return; }
    setIsFollowing(true);
    onFollow(item.artistId);
    try {
      await supabase.from('follows').insert({ fan_id: user.id, artist_id: item.artistId });
      toast.success(`Following ${item.artistName}`);
    } catch {
      setIsFollowing(false);
    }
  };

  const handleShare = async () => {
    const url = item.type === 'post'
      ? `${window.location.origin}/artist/${item.artistUserId}`
      : `${window.location.origin}/artist/${item.artistUserId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: item.artistName, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied');
      }
    } catch {}
  };

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: Math.min(index * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
      className="interactive-card bg-card border border-border rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button
          className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity"
          onClick={() => navigate(`/artist/${item.artistUserId}`)}
        >
          <Avatar className="h-9 w-9 ring-1 ring-border flex-shrink-0">
            <AvatarImage src={item.artistAvatar ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 text-left">
            <p className="text-sm font-semibold truncate leading-tight">{item.artistName}</p>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/artist/${item.artistUserId}`)}>
              View artist
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              <Flag className="h-4 w-4 mr-2" /> Report
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Post content */}
      {item.type === 'post' && (
        <div className="px-4 pb-2">
          {item.content && (
            <p className="text-sm text-foreground leading-relaxed line-clamp-4">{item.content}</p>
          )}
          {item.mediaUrls && item.mediaUrls.length > 0 && (
            <div className="mt-3 rounded-lg overflow-hidden">
              <img
                src={item.mediaUrls[0]}
                alt="Post media"
                className="w-full object-cover max-h-80"
                loading="lazy"
              />
            </div>
          )}
        </div>
      )}

      {/* Video content */}
      {item.type === 'video' && (
        <div className="px-4 pb-2">
          <button
            className="w-full relative rounded-lg overflow-hidden bg-muted aspect-video group"
            onClick={() => navigate(`/artist/${item.artistUserId}`)}
          >
            {item.thumbnailUrl ? (
              <img src={item.thumbnailUrl} alt="Video thumbnail" className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                <Play className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="h-12 w-12 rounded-full bg-card/90 flex items-center justify-center">
                <Play className="h-5 w-5 text-foreground ml-0.5" />
              </div>
            </div>
          </button>
          {item.caption && (
            <p className="text-sm text-foreground mt-2 line-clamp-2">{item.caption}</p>
          )}
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-1 px-3 pb-3 pt-1 border-t border-border/50 mt-1">
        {/* React */}
        <button
          onClick={handleReact}
          disabled={reacted}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all min-h-[44px]",
            reacted
              ? "text-destructive"
              : "text-muted-foreground hover:text-destructive hover:bg-muted active:scale-95"
          )}
        >
          <motion.div
            animate={reacted ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.2 }}
          >
            <Heart className={cn("h-4 w-4", reacted && "fill-current")} />
          </motion.div>
          <span>{formatCount(reactionCount)}</span>
        </button>

        {/* Comments */}
        {item.type === 'post' && (
          <button
            onClick={() => setCommentsOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all min-h-[44px]"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{formatCount(item.commentCount ?? 0)}</span>
          </button>
        )}

        {/* Views (video) */}
        {item.type === 'video' && (
          <span className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground">
            <Eye className="h-4 w-4" />
            {formatCount(item.viewCount ?? 0)}
          </span>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Follow — only if not already following */}
        {!isFollowing && (
          <button
            onClick={handleFollow}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 transition-all min-h-[44px] border border-primary/30"
          >
            <UserPlus className="h-4 w-4" />
            Follow
          </button>
        )}

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all min-h-[44px]"
        >
          <Share2 className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
    {item.type === 'post' && (
      <CommentsPanel
        postId={rawPostId}
        isOpen={commentsOpen}
        onOpenChange={setCommentsOpen}
        commentCount={item.commentCount}
      />
    )}
    </>
  );
}
