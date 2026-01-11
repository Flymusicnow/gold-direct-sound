import { useState } from "react";
import { format } from "date-fns";
import { 
  GripVertical, Trash2, Calendar, Link2, ExternalLink, 
  Music, Clock, Eye, EyeOff, MoreVertical, LayoutTemplate
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { SpotlightMedia } from "@/hooks/useArtistSpotlight";
import { cn } from "@/lib/utils";

interface SpotlightMediaCardProps {
  item: SpotlightMedia;
  onDelete: (id: string, url: string) => void;
  onUpdate: (id: string, updates: Partial<SpotlightMedia>) => void;
  isDragging?: boolean;
}

const PLATFORMS = [
  { value: 'spotify', label: 'Spotify' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'twitter', label: 'X (Twitter)' },
  { value: 'other', label: 'Other' },
];

export function SpotlightMediaCard({ 
  item, 
  onDelete, 
  onUpdate,
  isDragging 
}: SpotlightMediaCardProps) {
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [linkType, setLinkType] = useState(item.link_type);
  const [linkUrl, setLinkUrl] = useState(item.link_url || '');
  const [linkPlatform, setLinkPlatform] = useState(item.link_platform || '');
  const [linkLabel, setLinkLabel] = useState(item.link_label || '');
  const [startDate, setStartDate] = useState(item.start_date || '');
  const [endDate, setEndDate] = useState(item.end_date || '');

  const getStatus = () => {
    // Check publish_status first for scheduled/draft items
    if (item.publish_status === 'scheduled') return 'scheduled';
    if (item.publish_status === 'draft') return 'draft';
    
    if (!item.is_active) return 'inactive';
    const now = new Date();
    if (item.start_date && new Date(item.start_date) > now) return 'scheduled';
    if (item.end_date && new Date(item.end_date) < now) return 'expired';
    return 'active';
  };

  const status = getStatus();

  // Get template name from template_data if available
  const templateName = item.template_data && typeof item.template_data === 'object' 
    ? (item.template_data as Record<string, unknown>).templateName as string | undefined
    : undefined;

  const handleSaveLink = () => {
    onUpdate(item.id, {
      link_type: linkType as SpotlightMedia['link_type'],
      link_url: linkType === 'none' ? null : linkUrl,
      link_platform: linkType === 'external' ? linkPlatform : null,
      link_label: linkLabel || null,
    });
    setShowLinkDialog(false);
  };

  const handleSaveSchedule = () => {
    onUpdate(item.id, {
      start_date: startDate || null,
      end_date: endDate || null,
    });
    setShowScheduleDialog(false);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 bg-card border rounded-lg transition-shadow",
        isDragging && "shadow-lg ring-2 ring-primary"
      )}
    >
      {/* Drag Handle */}
      <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
        <GripVertical className="h-5 w-5" />
      </div>

      {/* Thumbnail */}
      <div className="w-16 h-28 rounded-md overflow-hidden bg-muted flex-shrink-0">
        {item.media_type === 'video' ? (
          <video 
            src={item.media_url} 
            className="w-full h-full object-cover"
            muted
          />
        ) : (
          <img 
            src={item.media_url} 
            alt="Spotlight" 
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge 
            variant={status === 'active' ? 'default' : 'secondary'}
            className={cn(
              "text-xs",
              status === 'scheduled' && "bg-blue-500/20 text-blue-600",
              status === 'draft' && "bg-amber-500/20 text-amber-600",
              status === 'expired' && "bg-muted text-muted-foreground",
              status === 'inactive' && "bg-muted text-muted-foreground"
            )}
          >
            {status === 'active' && <Eye className="h-3 w-3 mr-1" />}
            {status === 'inactive' && <EyeOff className="h-3 w-3 mr-1" />}
            {status === 'scheduled' && <Clock className="h-3 w-3 mr-1" />}
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {item.media_type}
          </Badge>
          {item.media_type === 'image' && (
            <Badge variant="outline" className="text-xs gap-1">
              <Clock className="h-3 w-3" />
              {item.display_duration_seconds}s
            </Badge>
          )}
          {templateName && (
            <Badge variant="outline" className="text-xs gap-1">
              <LayoutTemplate className="h-3 w-3" />
              {templateName}
            </Badge>
          )}
        </div>

        {/* Schedule Info */}
        {item.scheduled_for && (
          <p className="text-xs text-blue-600">
            Scheduled for {format(new Date(item.scheduled_for), 'MMM d, yyyy h:mm a')}
          </p>
        )}
        {(item.start_date || item.end_date) && !item.scheduled_for && (
          <p className="text-xs text-muted-foreground">
            {item.start_date && `From ${format(new Date(item.start_date), 'MMM d, yyyy')}`}
            {item.start_date && item.end_date && ' → '}
            {item.end_date && `Until ${format(new Date(item.end_date), 'MMM d, yyyy')}`}
          </p>
        )}

        {/* Link Info */}
        {item.link_type !== 'none' && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {item.link_type === 'external' ? (
              <>
                <ExternalLink className="h-3 w-3" />
                {item.link_platform || 'External'}
              </>
            ) : (
              <>
                <Music className="h-3 w-3" />
                FlyMusic Link
              </>
            )}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Switch
          checked={item.is_active}
          onCheckedChange={(checked) => onUpdate(item.id, { is_active: checked })}
        />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowScheduleDialog(true)}>
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowLinkDialog(true)}>
              <Link2 className="h-4 w-4 mr-2" />
              Edit Link
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem 
                  className="text-destructive"
                  onSelect={(e) => e.preventDefault()}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete spotlight media?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(item.id, item.media_url)}
                    className="bg-destructive text-destructive-foreground"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Link</DialogTitle>
            <DialogDescription>
              Add a link to this spotlight item
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Link Type</Label>
              <Select value={linkType} onValueChange={(v) => setLinkType(v as SpotlightMedia['link_type'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Link</SelectItem>
                  <SelectItem value="internal">
                    <span className="flex items-center gap-2">
                      <Music className="h-4 w-4 text-primary" />
                      FlyMusic Link (Recommended)
                    </span>
                  </SelectItem>
                  <SelectItem value="external">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <ExternalLink className="h-4 w-4" />
                      External Link
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {linkType === 'internal' && (
              <div>
                <Label>FlyMusic Path</Label>
                <Input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="/track/abc123 or /album/xyz"
                />
              </div>
            )}

            {linkType === 'external' && (
              <>
                <p className="text-xs text-amber-600 bg-amber-500/10 p-2 rounded">
                  External links receive no algorithmic boost and are clearly labeled to fans.
                </p>
                <div>
                  <Label>Platform</Label>
                  <Select value={linkPlatform} onValueChange={setLinkPlatform}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map(p => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>URL</Label>
                  <Input
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </>
            )}

            {linkType !== 'none' && (
              <div>
                <Label>Button Label (optional)</Label>
                <Input
                  value={linkLabel}
                  onChange={(e) => setLinkLabel(e.target.value)}
                  placeholder="Listen Now"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveLink}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule</DialogTitle>
            <DialogDescription>
              Set when this spotlight item should be visible
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Start Date (optional)</Label>
              <Input
                type="datetime-local"
                value={startDate ? startDate.slice(0, 16) : ''}
                onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value).toISOString() : '')}
              />
            </div>
            <div>
              <Label>End Date (optional)</Label>
              <Input
                type="datetime-local"
                value={endDate ? endDate.slice(0, 16) : ''}
                onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value).toISOString() : '')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSchedule}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
