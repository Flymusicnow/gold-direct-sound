import { format } from "date-fns";
import { Clock, Play, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SpotlightMedia } from "@/hooks/useArtistSpotlight";

interface ScheduledSpotlightsListProps {
  spotlights: SpotlightMedia[];
  onUpdate: () => void;
}

export function ScheduledSpotlightsList({ spotlights, onUpdate }: ScheduledSpotlightsListProps) {
  const handlePublishNow = async (id: string) => {
    try {
      const { error } = await supabase
        .from('artist_spotlight_media')
        .update({
          publish_status: 'published',
          is_active: true,
          scheduled_for: null,
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Spotlight published!');
      onUpdate();
    } catch (error) {
      console.error('Error publishing:', error);
      toast.error('Failed to publish');
    }
  };

  const handleCancel = async (id: string) => {
    try {
      const { error } = await supabase
        .from('artist_spotlight_media')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Scheduled spotlight cancelled');
      onUpdate();
    } catch (error) {
      console.error('Error cancelling:', error);
      toast.error('Failed to cancel');
    }
  };

  if (spotlights.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Clock className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p>No scheduled spotlights</p>
        <p className="text-sm">Schedule content to publish automatically</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {spotlights.map((spotlight) => (
        <div
          key={spotlight.id}
          className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border"
        >
          {/* Thumbnail */}
          <div className="w-12 h-20 rounded overflow-hidden bg-muted flex-shrink-0">
            {spotlight.media_type === 'video' ? (
              <video
                src={spotlight.media_url}
                className="w-full h-full object-cover"
                muted
              />
            ) : (
              <img
                src={spotlight.media_url}
                alt="Scheduled"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">
                <Clock className="h-3 w-3 mr-1" />
                {spotlight.publish_status === 'draft' ? 'Draft' : 'Scheduled'}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {spotlight.media_type}
              </Badge>
            </div>
            {spotlight.scheduled_for && (
              <p className="text-sm font-medium">
                {format(new Date(spotlight.scheduled_for), 'MMM d, yyyy')} at{' '}
                {format(new Date(spotlight.scheduled_for), 'h:mm a')}
              </p>
            )}
            {spotlight.publish_status === 'draft' && (
              <p className="text-sm text-muted-foreground">
                Saved as draft
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePublishNow(spotlight.id)}
              className="gap-1"
            >
              <Play className="h-3 w-3" />
              Publish Now
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel scheduled spotlight?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the scheduled spotlight.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleCancel(spotlight.id)}
                    className="bg-destructive text-destructive-foreground"
                  >
                    Cancel & Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ))}
    </div>
  );
}
