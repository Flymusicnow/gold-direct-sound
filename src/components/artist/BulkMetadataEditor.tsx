import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Music, Video, CheckSquare, Square, Wand2, ImageIcon, X } from "lucide-react";
import type { UploadFile } from "@/hooks/useMultiUpload";

// Video Thumbnail Picker Component
function VideoThumbnailPicker({ 
  file, 
  onThumbnailChange 
}: { 
  file: UploadFile; 
  onThumbnailChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const thumbnailPreview = file.thumbnailFile ? URL.createObjectURL(file.thumbnailFile) : null;

  return (
    <div className="relative shrink-0">
      <div 
        className="w-10 h-10 rounded bg-muted border border-dashed border-border flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary/50 transition-colors group"
        onClick={() => inputRef.current?.click()}
        title="Add thumbnail"
      >
        {thumbnailPreview ? (
          <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
        ) : (
          <Video className="h-5 w-5 text-blue-500 group-hover:hidden" />
        )}
        {!thumbnailPreview && (
          <ImageIcon className="h-4 w-4 text-muted-foreground hidden group-hover:block" />
        )}
      </div>
      {thumbnailPreview && (
        <button
          type="button"
          className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            onThumbnailChange(null);
          }}
        >
          <X className="h-2.5 w-2.5 text-destructive-foreground" />
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onThumbnailChange(e.target.files?.[0] || null)}
      />
    </div>
  );
}

interface BulkMetadataEditorProps {
  files: UploadFile[];
  onUpdateFile: (id: string, metadata: Partial<UploadFile>) => void;
  onUpdateAll: (metadata: Partial<UploadFile>) => void;
  onUpdateSelected: (ids: string[], metadata: Partial<UploadFile>) => void;
  albumCover: File | null;
  onAlbumCoverChange: (file: File | null) => void;
  albumTitle: string;
  onAlbumTitleChange: (title: string) => void;
  albumDescription: string;
  onAlbumDescriptionChange: (description: string) => void;
}

const GENRES = [
  "Pop", "Hip-Hop", "R&B", "Rock", "Electronic", "Jazz", "Classical",
  "Country", "Folk", "Indie", "Metal", "Reggae", "Soul", "Blues", "Other"
];

const MOODS = [
  "Energetic", "Chill", "Happy", "Sad", "Romantic", "Aggressive",
  "Peaceful", "Motivational", "Dark", "Uplifting", "Melancholic", "Party"
];

export function BulkMetadataEditor({
  files,
  onUpdateFile,
  onUpdateAll,
  onUpdateSelected,
  albumCover,
  onAlbumCoverChange,
  albumTitle,
  onAlbumTitleChange,
  albumDescription,
  onAlbumDescriptionChange
}: BulkMetadataEditorProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkGenre, setBulkGenre] = useState<string>("");
  const [bulkMood, setBulkMood] = useState<string>("");
  const [bulkVisibility, setBulkVisibility] = useState<string>("");
  const [bulkTags, setBulkTags] = useState<string>("");
  const coverInputRef = useRef<HTMLInputElement>(null);

  const albumCoverPreview = albumCover ? URL.createObjectURL(albumCover) : null;

  const allSelected = selectedIds.size === files.length && files.length > 0;
  const someSelected = selectedIds.size > 0;

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(files.map(f => f.id)));
    }
  };

  const applyBulkMetadata = (applyToAll: boolean) => {
    const metadata: Partial<UploadFile> = {};
    
    if (bulkGenre) metadata.genre = bulkGenre;
    if (bulkMood) metadata.mood = bulkMood;
    if (bulkVisibility) metadata.visibility = bulkVisibility as any;
    if (bulkTags) metadata.tags = bulkTags.split(',').map(t => t.trim()).filter(Boolean);

    if (Object.keys(metadata).length === 0) return;

    if (applyToAll) {
      onUpdateAll(metadata);
    } else {
      onUpdateSelected(Array.from(selectedIds), metadata);
    }

    // Reset bulk fields
    setBulkGenre("");
    setBulkMood("");
    setBulkVisibility("");
    setBulkTags("");
  };

  return (
    <div className="space-y-6">
      {/* Album Info Section */}
      <div className="p-4 border border-primary/20 rounded-lg bg-primary/5 space-y-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Album Information</h3>
        </div>
        
        {/* Album Title */}
        <div>
          <Label className="text-sm font-medium">Album Title *</Label>
          <Input
            value={albumTitle}
            onChange={(e) => onAlbumTitleChange(e.target.value)}
            placeholder="Enter album title (e.g., WATER)"
            className="mt-1"
          />
        </div>
        
        {/* Album Description */}
        <div>
          <Label className="text-sm font-medium">Description (optional)</Label>
          <Input
            value={albumDescription}
            onChange={(e) => onAlbumDescriptionChange(e.target.value)}
            placeholder="Add album description..."
            className="mt-1"
          />
        </div>
        
        {/* Album Cover */}
        <div>
          <Label className="text-sm font-medium">Album Cover</Label>
          <div className="flex items-center gap-4 mt-2">
            {/* Preview */}
            <div 
              className="w-20 h-20 rounded-lg bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => coverInputRef.current?.click()}
            >
              {albumCoverPreview ? (
                <img src={albumCoverPreview} alt="Album cover" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              )}
            </div>

            <div className="flex-1">
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onAlbumCoverChange(e.target.files?.[0] || null)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => coverInputRef.current?.click()}
              >
                {albumCover ? "Change Cover" : "Upload Cover"}
              </Button>
              {albumCover && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-2 text-destructive hover:text-destructive"
                  onClick={() => onAlbumCoverChange(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Applies to all {files.length} tracks
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Edit Panel */}
      <div className="p-4 border border-primary/20 rounded-lg bg-primary/5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Wand2 className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Bulk Edit Metadata</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label className="text-xs">Visibility</Label>
            <Select value={bulkVisibility} onValueChange={setBulkVisibility}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="supporter-only">Supporter Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Genre</Label>
            <Select value={bulkGenre} onValueChange={setBulkGenre}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select genre" />
              </SelectTrigger>
              <SelectContent>
                {GENRES.map(genre => (
                  <SelectItem key={genre} value={genre.toLowerCase()}>{genre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Mood</Label>
            <Select value={bulkMood} onValueChange={setBulkMood}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select mood" />
              </SelectTrigger>
              <SelectContent>
                {MOODS.map(mood => (
                  <SelectItem key={mood} value={mood.toLowerCase()}>{mood}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Tags (comma-separated)</Label>
            <Input
              value={bulkTags}
              onChange={(e) => setBulkTags(e.target.value)}
              placeholder="e.g. summer, chill, 2024"
              className="mt-1"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            onClick={() => applyBulkMetadata(true)}
            disabled={!bulkGenre && !bulkMood && !bulkVisibility && !bulkTags}
          >
            Apply to All ({files.length})
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyBulkMetadata(false)}
            disabled={!someSelected || (!bulkGenre && !bulkMood && !bulkVisibility && !bulkTags)}
          >
            Apply to Selected ({selectedIds.size})
          </Button>
        </div>
      </div>

      {/* File List with Individual Edit */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Files ({files.length})</h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleSelectAll}
            className="gap-2"
          >
            {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
            {allSelected ? "Deselect All" : "Select All"}
          </Button>
        </div>

        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
          {files.map(file => (
            <div 
              key={file.id}
              className="flex items-start gap-3 p-3 border rounded-lg"
            >
              {/* Checkbox */}
              <Checkbox
                checked={selectedIds.has(file.id)}
                onCheckedChange={() => toggleSelect(file.id)}
                className="mt-1"
              />

              {/* File Icon / Video Thumbnail */}
              {file.type === 'video' ? (
                <VideoThumbnailPicker 
                  file={file}
                  onThumbnailChange={(thumbFile) => onUpdateFile(file.id, { thumbnailFile: thumbFile })}
                />
              ) : (
                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                  <Music className="h-5 w-5 text-primary" />
                </div>
              )}

              {/* Editable Fields */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                <div>
                  <Input
                    value={file.title}
                    onChange={(e) => onUpdateFile(file.id, { title: e.target.value })}
                    placeholder="Title"
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Select 
                    value={file.visibility} 
                    onValueChange={(v) => onUpdateFile(file.id, { visibility: v as any })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="supporter-only">Supporter Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select 
                    value={file.genre || ""} 
                    onValueChange={(v) => onUpdateFile(file.id, { genre: v })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENRES.map(genre => (
                        <SelectItem key={genre} value={genre.toLowerCase()}>{genre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {file.tags?.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                  {file.mood && (
                    <Badge variant="outline" className="text-xs">{file.mood}</Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}