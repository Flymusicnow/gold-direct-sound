import { useNavigate } from "react-router-dom";
import { Sparkles, Heart, MessageSquare, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

interface NotificationItemProps {
  notification: Notification;
  onRead: () => void;
  onClose: () => void;
}

export function NotificationItem({ notification, onRead, onClose }: NotificationItemProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!notification.read) {
      onRead();
    }
    if (notification.link) {
      navigate(notification.link);
      onClose();
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'spotlight_vote':
        return <Sparkles className="h-4 w-4 text-primary" />;
      case 'new_follower':
        return <Users className="h-4 w-4 text-primary" />;
      case 'track_liked':
        return <Heart className="h-4 w-4 text-primary" />;
      case 'comment_reply':
        return <MessageSquare className="h-4 w-4 text-primary" />;
      default:
        return <Sparkles className="h-4 w-4 text-primary" />;
    }
  };

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });

  return (
    <div
      onClick={handleClick}
      className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
        !notification.read ? 'bg-primary/5' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className={`text-sm font-medium ${!notification.read ? 'text-foreground' : 'text-foreground/80'}`}>
              {notification.title}
            </p>
            {!notification.read && (
              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
            )}
          </div>
          
          <p className="text-xs text-muted-foreground line-clamp-2">
            {notification.message}
          </p>
          
          <p className="text-xs text-muted-foreground mt-1">
            {timeAgo}
          </p>
        </div>
      </div>
    </div>
  );
}