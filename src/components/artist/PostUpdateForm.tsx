import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Send } from "lucide-react";

interface PostUpdateFormProps {
  artistId: string;
  onPostCreated?: () => void;
}

export function PostUpdateForm({ artistId, onPostCreated }: PostUpdateFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"public" | "followers">("public");
  const [posting, setPosting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error("Please write some content");
      return;
    }

    setPosting(true);

    try {
      const { error } = await supabase.from('artist_posts').insert({
        artist_id: artistId,
        title: title.trim() || null,
        content: content.trim(),
        visibility,
      });

      if (error) throw error;

      toast.success("Post shared with your fans!");
      setTitle("");
      setContent("");
      setVisibility("public");
      onPostCreated?.();
    } catch (error: any) {
      toast.error(error.message || "Error creating post");
    } finally {
      setPosting(false);
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-card/80 border-border/50">
      <h3 className="text-lg font-semibold mb-4">Post an Update</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="post-title" className="text-sm font-medium">Title (optional)</Label>
          <Input
            id="post-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your update a title..."
            maxLength={100}
            className="mt-1.5 focus:ring-2 focus:ring-primary/20"
          />
        </div>
        
        <div>
          <Label htmlFor="post-content" className="text-sm font-medium">Content *</Label>
          <Textarea
            id="post-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share something with your fans..."
            rows={4}
            required
            className="mt-1.5 focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <Label htmlFor="visibility" className="text-sm font-medium">Who can see this?</Label>
          <Select value={visibility} onValueChange={(v: "public" | "followers") => setVisibility(v)}>
            <SelectTrigger id="visibility" className="mt-1.5 focus:ring-2 focus:ring-primary/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Everyone (Public)</SelectItem>
              <SelectItem value="followers">Followers Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" disabled={posting} className="w-full shadow-gold hover:shadow-lg transition-all">
          <Send className="mr-2 h-4 w-4" />
          {posting ? "Posting..." : "Share with Fans"}
        </Button>
      </form>
    </Card>
  );
}
