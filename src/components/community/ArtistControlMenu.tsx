import React, { useState } from 'react';
import { MoreVertical, Pin, EyeOff, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCommunityViewOptional } from '@/contexts/CommunityViewContext';

interface ArtistControlMenuProps {
  type: 'post' | 'comment';
  itemId: string;
  isPinned?: boolean;
  isHidden?: boolean;
  isOwnContent?: boolean;
  onEdit?: () => void;
  onPin?: (isPinned: boolean) => void;
  onHide?: () => void;
  onDelete?: () => void;
}

export const ArtistControlMenu: React.FC<ArtistControlMenuProps> = ({
  type,
  itemId,
  isPinned = false,
  isHidden = false,
  isOwnContent = false,
  onEdit,
  onPin,
  onHide,
  onDelete,
}) => {
  const context = useCommunityViewOptional();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Only show if user has moderation authority
  if (!context?.canModerate) {
    return null;
  }

  const { moderatorPermissions, isOwner } = context;

  // Determine what actions are available
  const canPin = type === 'post' 
    ? (isOwner || moderatorPermissions?.canPinPosts)
    : (isOwner || moderatorPermissions?.canPinComments);

  const canHide = type === 'post'
    ? (isOwner || moderatorPermissions?.canHidePosts)
    : (isOwner || moderatorPermissions?.canHideComments);

  const canEdit = isOwnContent;
  const canDelete = isOwner && isOwnContent;

  // If no actions available, don't render
  if (!canPin && !canHide && !canEdit && !canDelete) {
    return null;
  }

  const handlePin = () => {
    if (type === 'post') {
      context.pinPost(itemId, !isPinned);
    } else {
      context.pinComment(itemId, !isPinned);
    }
    onPin?.(!isPinned);
  };

  const handleHide = () => {
    if (type === 'post') {
      context.hidePost(itemId);
    } else {
      context.hideComment(itemId);
    }
    onHide?.();
  };

  const handleDelete = () => {
    setShowDeleteDialog(false);
    onDelete?.();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">More options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {canEdit && onEdit && (
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
          )}

          {canPin && (
            <DropdownMenuItem onClick={handlePin}>
              <Pin className="h-4 w-4 mr-2" />
              {isPinned ? 'Unpin' : 'Pin'} {type}
            </DropdownMenuItem>
          )}

          {canHide && (
            <DropdownMenuItem onClick={handleHide} className="text-orange-500">
              <EyeOff className="h-4 w-4 mr-2" />
              Hide {type}
            </DropdownMenuItem>
          )}

          {canDelete && onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete {type}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {type}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the {type}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
