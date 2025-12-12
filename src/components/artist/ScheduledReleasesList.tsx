import { useState } from "react";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { Calendar, Clock, Music, Video, MoreVertical, Pencil, X, Rocket, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useScheduledReleases, ScheduledRelease } from "@/hooks/useScheduledReleases";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ScheduledReleasesListProps {
  artistId: string;
}

export function ScheduledReleasesList({ artistId }: ScheduledReleasesListProps) {
  const { releases, loading, cancelSchedule, releaseNow } = useScheduledReleases(artistId);
  const [confirmRelease, setConfirmRelease] = useState<ScheduledRelease | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<ScheduledRelease | null>(null);

  const scheduledReleases = releases.filter(r => r.status === 'scheduled');
  const drafts = releases.filter(r => r.status === 'draft');

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Scheduled Releases</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (releases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Scheduled Releases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No scheduled releases</p>
            <p className="text-xs">Schedule your next release when uploading</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderRelease = (release: ScheduledRelease) => {
    const isScheduled = release.status === 'scheduled';
    const releaseDate = release.release_date ? new Date(release.release_date) : null;
    const isOverdue = releaseDate && isPast(releaseDate);

    return (
      <div
        key={release.id}
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border",
          isOverdue && "border-orange-500/50 bg-orange-500/5"
        )}
      >
        {/* Cover/Thumbnail */}
        <div className="relative h-12 w-12 rounded bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
          {release.cover_url ? (
            <img src={release.cover_url} alt="" className="h-full w-full object-cover" />
          ) : release.type === 'track' ? (
            <Music className="h-5 w-5 text-muted-foreground" />
          ) : (
            <Video className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm truncate">{release.title}</p>
            <Badge variant={release.type === 'track' ? 'default' : 'secondary'} className="text-xs">
              {release.type}
            </Badge>
          </div>
          
          {isScheduled && releaseDate ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              <Clock className="h-3 w-3" />
              {isOverdue ? (
                <span className="text-orange-500">Processing...</span>
              ) : (
                <span>
                  Releases {formatDistanceToNow(releaseDate, { addSuffix: true })}
                  <span className="hidden sm:inline"> • {format(releaseDate, 'PPP p')}</span>
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              <FileText className="h-3 w-3" />
              <span>Draft • Not scheduled</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setConfirmRelease(release)}>
              <Rocket className="h-4 w-4 mr-2" />
              Release Now
            </DropdownMenuItem>
            {isScheduled && (
              <DropdownMenuItem onClick={() => setConfirmCancel(release)}>
                <X className="h-4 w-4 mr-2" />
                Cancel Schedule
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Scheduled Releases
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {scheduledReleases.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Upcoming ({scheduledReleases.length})
              </p>
              <div className="space-y-2">
                {scheduledReleases.map(renderRelease)}
              </div>
            </div>
          )}
          
          {drafts.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Drafts ({drafts.length})
              </p>
              <div className="space-y-2">
                {drafts.map(renderRelease)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Release Now Confirmation */}
      <AlertDialog open={!!confirmRelease} onOpenChange={() => setConfirmRelease(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Release Now?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately publish "{confirmRelease?.title}" and make it visible to all fans.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmRelease) {
                  releaseNow(confirmRelease.id, confirmRelease.type);
                  setConfirmRelease(null);
                }
              }}
            >
              Release Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Schedule Confirmation */}
      <AlertDialog open={!!confirmCancel} onOpenChange={() => setConfirmCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Schedule?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the scheduled release and save "{confirmCancel?.title}" as a draft. You can reschedule it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Scheduled</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmCancel) {
                  cancelSchedule(confirmCancel.id, confirmCancel.type);
                  setConfirmCancel(null);
                }
              }}
            >
              Save as Draft
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
