import React, { useState } from 'react';
import { Shield, UserPlus, MoreVertical, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { useCommunityModerators, type Moderator, type ModeratorPermissions } from '@/hooks/useCommunityModerator';
import { AddModeratorDialog } from './AddModeratorDialog';

interface ModeratorManagementProps {
  communityId: string | null;
  currentUserId: string;
}

interface ModeratorCardProps {
  moderator: Moderator;
  onRevoke: () => void;
  onUpdatePermissions: (permissions: Partial<ModeratorPermissions>) => void;
}

const ModeratorCard: React.FC<ModeratorCardProps> = ({
  moderator,
  onRevoke,
  onUpdatePermissions,
}) => {
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
        <Avatar className="h-10 w-10">
          <AvatarImage src={moderator.avatarUrl || undefined} />
          <AvatarFallback>{moderator.displayName[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{moderator.displayName}</span>
            <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/30">
              Mod
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Added {formatDistanceToNow(new Date(moderator.assignedAt), { addSuffix: true })}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsExpanded(!isExpanded)}>
              Edit Permissions
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setShowRevokeDialog(true)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Moderator
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Expanded permissions */}
      {isExpanded && (
        <div className="ml-12 p-3 space-y-3 bg-muted/30 rounded-lg border border-border/30">
          <div className="flex items-center justify-between">
            <Label htmlFor={`hide-comments-${moderator.id}`} className="text-sm">
              Can hide comments
            </Label>
            <Switch
              id={`hide-comments-${moderator.id}`}
              checked={moderator.canHideComments}
              onCheckedChange={(checked) => onUpdatePermissions({ canHideComments: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor={`pin-comments-${moderator.id}`} className="text-sm">
              Can pin comments
            </Label>
            <Switch
              id={`pin-comments-${moderator.id}`}
              checked={moderator.canPinComments}
              onCheckedChange={(checked) => onUpdatePermissions({ canPinComments: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor={`hide-posts-${moderator.id}`} className="text-sm">
              Can hide posts
            </Label>
            <Switch
              id={`hide-posts-${moderator.id}`}
              checked={moderator.canHidePosts}
              onCheckedChange={(checked) => onUpdatePermissions({ canHidePosts: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor={`pin-posts-${moderator.id}`} className="text-sm">
              Can pin posts
            </Label>
            <Switch
              id={`pin-posts-${moderator.id}`}
              checked={moderator.canPinPosts}
              onCheckedChange={(checked) => onUpdatePermissions({ canPinPosts: checked })}
            />
          </div>
        </div>
      )}

      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Moderator?</AlertDialogTitle>
            <AlertDialogDescription>
              {moderator.displayName} will no longer be able to moderate your community.
              This action can be undone by adding them again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onRevoke}
              className="bg-destructive text-destructive-foreground"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export const ModeratorManagement: React.FC<ModeratorManagementProps> = ({
  communityId,
  currentUserId,
}) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { moderators, isLoading, addModerator, updatePermissions, revokeModerator } =
    useCommunityModerators(communityId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Community Moderators
          </CardTitle>
          <CardDescription>
            Assign trusted fans to help moderate your community
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {moderators.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No moderators assigned yet</p>
              <p className="text-sm mt-1">
                Add trusted fans to help manage your community
              </p>
            </div>
          ) : (
            moderators.map((mod) => (
              <ModeratorCard
                key={mod.id}
                moderator={mod}
                onRevoke={() => revokeModerator(mod.id)}
                onUpdatePermissions={(perms) => updatePermissions(mod.id, perms)}
              />
            ))
          )}

          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => setShowAddDialog(true)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Moderator
          </Button>
        </CardContent>
      </Card>

      <AddModeratorDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        communityId={communityId}
        currentUserId={currentUserId}
        existingModeratorIds={moderators.map((m) => m.userId)}
        onAdd={(userId, permissions) => {
          addModerator(userId, permissions, currentUserId);
          setShowAddDialog(false);
        }}
      />
    </>
  );
};
