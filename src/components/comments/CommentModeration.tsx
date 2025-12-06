import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pin, EyeOff, Eye, Flag } from "lucide-react";
import { useCommentModeration } from "@/hooks/useCommentModeration";

interface CommentModerationProps {
  commentId: string;
  isPinned?: boolean;
  isHidden?: boolean;
  tableName?: 'comments' | 'video_comments';
  onUpdate?: () => void;
}

export function CommentModeration({
  commentId,
  isPinned = false,
  isHidden = false,
  tableName = 'comments',
  onUpdate,
}: CommentModerationProps) {
  const { pinComment, hideComment, reportComment } = useCommentModeration();

  const handlePin = async () => {
    const success = await pinComment(commentId, !isPinned, tableName);
    if (success) onUpdate?.();
  };

  const handleHide = async () => {
    const success = await hideComment(commentId, !isHidden, tableName);
    if (success) onUpdate?.();
  };

  const handleReport = async () => {
    await reportComment(commentId, tableName);
    onUpdate?.();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handlePin}>
          <Pin className="mr-2 h-4 w-4" />
          {isPinned ? "Unpin" : "Pin"} comment
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleHide}>
          {isHidden ? (
            <>
              <Eye className="mr-2 h-4 w-4" />
              Show comment
            </>
          ) : (
            <>
              <EyeOff className="mr-2 h-4 w-4" />
              Hide comment
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleReport} className="text-destructive">
          <Flag className="mr-2 h-4 w-4" />
          Report comment
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
