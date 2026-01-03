import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface PostComposerProps {
  communityId: string;
  artistId: string;
  isArtist: boolean;
  onPostCreated?: () => void;
}

const TIERS = [
  { value: 'free', label: 'Free - Everyone' },
  { value: 'bronze', label: 'Bronze' },
  { value: 'silver', label: 'Silver' },
  { value: 'gold', label: 'Gold' },
  { value: 'diamond', label: 'Diamond' }
];

export const PostComposer: React.FC<PostComposerProps> = ({
  communityId,
  artistId,
  isArtist,
  onPostCreated
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [tierRequired, setTierRequired] = useState('free');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('community_posts')
        .insert({
          community_id: communityId,
          author_id: user.id,
          author_type: isArtist ? 'artist' : 'fan',
          content: content.trim(),
          post_type: 'text',
          tier_required: isArtist ? tierRequired : 'free',
          media_urls: []
        });

      if (error) throw error;

      setContent('');
      setTierRequired('free');
      toast.success('Post published!');
      onPostCreated?.();
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Create Post</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="content">What's on your mind?</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share something with the community..."
              className="mt-1.5 min-h-[120px] resize-none"
              required
            />
          </div>

          {isArtist && (
            <div>
              <Label>Who can see this post?</Label>
              <Select value={tierRequired} onValueChange={setTierRequired}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIERS.map((tier) => (
                    <SelectItem key={tier.value} value={tier.value}>
                      {tier.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Only members with {tierRequired === 'free' ? 'any subscription' : `${tierRequired} tier or higher`} can view this post
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={!content.trim() || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Post
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
