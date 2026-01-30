import { useState, useEffect } from 'react';
import { Send, Pencil, Trash2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getCommentAuthorInfo } from '@/lib/utils/commentAuthor';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profile: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  isArtist: boolean;
  artistId: string | null;
  artistName: string | null;
}

interface SpotlightEntryCommentsProps {
  entryId: string;
  onCommentCountChange?: (count: number) => void;
}

export default function SpotlightEntryComments({ entryId, onCommentCountChange }: SpotlightEntryCommentsProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const fetchComments = async () => {
    setIsLoading(true);
    
    const { data: commentsData, error } = await supabase
      .from('spotlight_entry_comments')
      .select('id, content, created_at, user_id')
      .eq('entry_id', entryId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error || !commentsData) {
      setIsLoading(false);
      return;
    }

    const userIds = [...new Set(commentsData.map(c => c.user_id))];

    const { data: profiles } = await supabase
      .from('public_profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds);

    const { data: artistProfiles } = await supabase
      .from('artist_profiles')
      .select('id, user_id, artist_name')
      .in('user_id', userIds)
      .eq('status', 'approved');

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    const artistMap = new Map(artistProfiles?.map(a => [a.user_id, { id: a.id, name: a.artist_name }]) || []);

    const enrichedComments: Comment[] = commentsData.map(comment => ({
      id: comment.id,
      content: comment.content,
      created_at: comment.created_at,
      user_id: comment.user_id,
      profile: profileMap.get(comment.user_id) || null,
      isArtist: artistMap.has(comment.user_id),
      artistId: artistMap.get(comment.user_id)?.id || null,
      artistName: artistMap.get(comment.user_id)?.name || null,
    }));

    setComments(enrichedComments);
    onCommentCountChange?.(enrichedComments.length);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchComments();

    const channel = supabase
      .channel(`spotlight-comments-${entryId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'spotlight_entry_comments',
          filter: `entry_id=eq.${entryId}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [entryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);

    const { error } = await supabase
      .from('spotlight_entry_comments')
      .insert({
        entry_id: entryId,
        user_id: user.id,
        content: newComment.trim(),
      });

    if (!error) {
      setNewComment('');
      fetchComments();
    }

    setIsSubmitting(false);
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleUpdate = async () => {
    if (!editContent.trim() || !editingId || !user) return;

    const { error } = await supabase
      .from('spotlight_entry_comments')
      .update({ content: editContent.trim() })
      .eq('id', editingId)
      .eq('user_id', user.id);

    if (!error) {
      setEditingId(null);
      setEditContent('');
      fetchComments();
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('spotlight_entry_comments')
      .update({ is_deleted: true })
      .eq('id', commentId)
      .eq('user_id', user.id);

    if (!error) {
      fetchComments();
    }
  };

  const handleAuthorClick = (comment: Comment, e: React.MouseEvent) => {
    e.stopPropagation();
    const authorInfo = getCommentAuthorInfo(
      comment.profile,
      comment.isArtist,
      comment.artistId,
      comment.artistName
    );
    if (authorInfo.isNavigable && authorInfo.targetPath) {
      navigate(authorInfo.targetPath);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'nu';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  return (
    <div className="border-t border-border pt-3 space-y-3">
      {/* Comments list */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground text-center py-2">Laddar...</div>
      ) : comments.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-2">
          Inga kommentarer än. Bli först!
        </div>
      ) : (
        <div className="space-y-2">
          {comments.map((comment) => {
            const authorInfo = getCommentAuthorInfo(
              comment.profile,
              comment.isArtist,
              comment.artistId,
              comment.artistName
            );
            const isOwner = user?.id === comment.user_id;
            const isEditing = editingId === comment.id;
            
            return (
              <div key={comment.id} className="flex gap-2 items-start group">
                <Avatar className="h-6 w-6 flex-shrink-0">
                  <AvatarImage src={comment.profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {authorInfo.displayName[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span
                      onClick={(e) => handleAuthorClick(comment, e)}
                      className={cn(
                        "text-sm font-medium truncate",
                        authorInfo.isNavigable && "cursor-pointer hover:underline"
                      )}
                    >
                      {authorInfo.displayName}
                    </span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatTime(comment.created_at)}
                    </span>
                    {isOwner && !isEditing && (
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5"
                          onClick={() => startEdit(comment)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(comment.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {isEditing ? (
                    <div className="mt-1 space-y-2">
                      <Input
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="h-8 text-sm"
                        autoFocus
                      />
                      <div className="flex items-center gap-1">
                        <EmojiPicker onEmojiSelect={(emoji) => setEditContent(prev => prev + emoji)} />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2"
                          onClick={cancelEdit}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Avbryt
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 px-2"
                          onClick={handleUpdate}
                          disabled={!editContent.trim()}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Spara
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-foreground break-words">{comment.content}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Comment input */}
      {user ? (
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Skriv en kommentar..."
            className="flex-1 h-8 text-sm"
            disabled={isSubmitting}
          />
          <EmojiPicker onEmojiSelect={(emoji) => setNewComment(prev => prev + emoji)} />
          <Button
            type="submit"
            size="icon"
            className="h-8 w-8"
            disabled={!newComment.trim() || isSubmitting}
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </form>
      ) : (
        <p className="text-xs text-muted-foreground text-center">
          Logga in för att kommentera
        </p>
      )}
    </div>
  );
}
