import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tag, X } from "lucide-react";

export const GENRES = [
  "Pop", "Hip-Hop", "R&B", "Rock", "Electronic", "Jazz", "Classical",
  "Country", "Folk", "Indie", "Metal", "Reggae", "Soul", "Blues", "Other"
];

export const MOODS = [
  "Energetic", "Chill", "Happy", "Sad", "Romantic", "Aggressive",
  "Peaceful", "Motivational", "Dark", "Uplifting", "Melancholic", "Party"
];

const QUICK_TAGS = ["New Release", "Featured", "Remix", "Original", "Live", "Acoustic"];

interface TrackMetadataFieldsProps {
  genre: string;
  onGenreChange: (genre: string) => void;
  mood: string;
  onMoodChange: (mood: string) => void;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  compact?: boolean;
}

export function TrackMetadataFields({
  genre,
  onGenreChange,
  mood,
  onMoodChange,
  tags,
  onTagsChange,
  compact = false
}: TrackMetadataFieldsProps) {
  const tagsInput = tags.join(", ");

  const handleTagsInputChange = (value: string) => {
    const newTags = value
      .split(",")
      .map(t => t.trim())
      .filter(t => t.length > 0);
    onTagsChange(newTags);
  };

  const addTag = (tag: string) => {
    if (!tags.includes(tag)) {
      onTagsChange([...tags, tag]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(t => t !== tagToRemove));
  };

  return (
    <div className={`space-y-${compact ? '3' : '4'}`}>
      {/* Genre & Mood - Side by side on larger screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="track-genre">Genre</Label>
          <Select value={genre} onValueChange={onGenreChange}>
            <SelectTrigger id="track-genre">
              <SelectValue placeholder="Select genre" />
            </SelectTrigger>
            <SelectContent>
              {GENRES.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="track-mood">Mood</Label>
          <Select value={mood} onValueChange={onMoodChange}>
            <SelectTrigger id="track-mood">
              <SelectValue placeholder="Select mood" />
            </SelectTrigger>
            <SelectContent>
              {MOODS.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Tags
        </Label>
        
        {/* Current Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="pl-2 pr-1 py-1 gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-destructive touch-manipulation"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <Input
          value={tagsInput}
          onChange={(e) => handleTagsInputChange(e.target.value)}
          placeholder="Enter tags separated by commas"
          className="text-sm"
        />

        {/* Quick Add Tags */}
        <div className="flex flex-wrap gap-1 mt-2">
          {QUICK_TAGS.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="cursor-pointer hover:bg-primary/10 transition-colors text-xs touch-manipulation"
              onClick={() => addTag(tag)}
            >
              + {tag}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
