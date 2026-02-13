import React from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { CommentThread } from './CommentThread';
import { CommentComposer } from './CommentComposer';
import { useAuth } from '@/contexts/AuthContext';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CommentsPanelProps {
  postId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  communityArtistUserId?: string;
  commentCount?: number;
}

export const CommentsPanel: React.FC<CommentsPanelProps> = ({
  postId,
  isOpen,
  onOpenChange,
  communityArtistUserId,
  commentCount,
}) => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = React.useState(0);

  const handleCommentCreated = () => {
    setRefreshKey((k) => k + 1);
  };

  const headerContent = (
    <div className="flex items-center gap-2">
      <MessageCircle className="h-5 w-5" />
      <span>Comments{commentCount != null ? ` (${commentCount})` : ''}</span>
    </div>
  );

  const bodyContent = (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-2">
      <CommentThread
        key={refreshKey}
        postId={postId}
        communityArtistUserId={communityArtistUserId}
      />
    </div>
  );

  const footerContent = user ? (
    <div className="border-t border-border bg-background p-4">
      <CommentComposer
        postId={postId}
        onCommentCreated={handleCommentCreated}
      />
    </div>
  ) : null;

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[60dvh] min-h-[50dvh] max-h-[75dvh] flex flex-col">
          <DrawerHeader className="flex-shrink-0 flex items-center justify-between pb-2">
            <DrawerTitle>{headerContent}</DrawerTitle>
          </DrawerHeader>
          {bodyContent}
          {footerContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[480px] flex flex-col p-0"
      >
        <SheetHeader className="flex-shrink-0 p-4 pb-2 border-b border-border">
          <SheetTitle>{headerContent}</SheetTitle>
        </SheetHeader>
        {bodyContent}
        {footerContent}
      </SheetContent>
    </Sheet>
  );
};
