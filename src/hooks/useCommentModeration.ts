import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useCommentModeration() {
  const pinComment = async (commentId: string, isPinned: boolean, tableName: 'comments' | 'video_comments' = 'comments') => {
    try {
      const { error } = await supabase
        .from(tableName)
        .update({ is_pinned: isPinned } as any)
        .eq('id', commentId);

      if (error) throw error;
      toast.success(isPinned ? "Comment pinned" : "Comment unpinned");
      return true;
    } catch (error) {
      console.error('Error pinning comment:', error);
      toast.error("Failed to update comment");
      return false;
    }
  };

  const hideComment = async (commentId: string, isHidden: boolean, tableName: 'comments' | 'video_comments' = 'comments') => {
    try {
      const { error } = await supabase
        .from(tableName)
        .update({ is_hidden: isHidden } as any)
        .eq('id', commentId);

      if (error) throw error;
      toast.success(isHidden ? "Comment hidden" : "Comment visible");
      return true;
    } catch (error) {
      console.error('Error hiding comment:', error);
      toast.error("Failed to update comment");
      return false;
    }
  };

  const reportComment = async (commentId: string, tableName: 'comments' | 'video_comments' = 'comments') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from(tableName)
        .update({ 
          reported_at: new Date().toISOString(),
          reported_by: user.id 
        } as any)
        .eq('id', commentId);

      if (error) throw error;
      toast.success("Comment reported");
      return true;
    } catch (error) {
      console.error('Error reporting comment:', error);
      toast.error("Failed to report comment");
      return false;
    }
  };

  return { pinComment, hideComment, reportComment };
}
