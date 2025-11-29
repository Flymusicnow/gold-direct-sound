import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Radio, Calendar, Users, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

interface LiveStreamCardProps {
  stream: {
    id: string;
    title: string;
    description?: string;
    status: string;
    scheduled_start?: string;
    actual_start?: string;
    viewer_count: number;
    thumbnail_url?: string;
  };
  isOwner?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function LiveStreamCard({ stream, isOwner, onEdit, onDelete }: LiveStreamCardProps) {
  const getStatusBadge = () => {
    switch (stream.status) {
      case "live":
        return <Badge className="bg-red-500 text-white animate-pulse">🔴 LIVE</Badge>;
      case "scheduled":
        return <Badge variant="secondary">Scheduled</Badge>;
      case "ended":
        return <Badge variant="outline">Ended</Badge>;
      default:
        return null;
    }
  };

  const getStreamDate = () => {
    if (stream.status === "live" && stream.actual_start) {
      return format(new Date(stream.actual_start), "PPp");
    }
    if (stream.scheduled_start) {
      return format(new Date(stream.scheduled_start), "PPp");
    }
    return null;
  };

  return (
    <Card className="overflow-hidden bg-card/50 border-border/50 hover:border-primary/30 transition-all duration-300 group">
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-muted/30">
        {stream.thumbnail_url ? (
          <img
            src={stream.thumbnail_url}
            alt={stream.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Radio className="h-16 w-16 opacity-30" />
          </div>
        )}
        
        <div className="absolute top-2 right-2">
          {getStatusBadge()}
        </div>

        {stream.status === "live" && (
          <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded flex items-center gap-1 text-sm">
            <Users className="h-3 w-3 text-red-500" />
            <span className="text-white font-semibold">{stream.viewer_count}</span>
          </div>
        )}

        {isOwner && (
          <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="secondary"
              onClick={onEdit}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={onDelete}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Stream Info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-foreground line-clamp-1">{stream.title}</h3>
          {stream.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {stream.description}
            </p>
          )}
        </div>

        {getStreamDate() && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{getStreamDate()}</span>
          </div>
        )}

        {stream.status === "live" && (
          <Link to={`/live/${stream.id}`}>
            <Button className="w-full bg-red-500 hover:bg-red-600 text-white">
              Watch Now
            </Button>
          </Link>
        )}
      </div>
    </Card>
  );
}
