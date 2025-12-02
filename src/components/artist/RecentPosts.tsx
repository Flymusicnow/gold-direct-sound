import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Users, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { EmptyStateCard } from "./EmptyStateCard";

interface Post {
  id: string;
  title: string | null;
  content: string;
  visibility: string;
  created_at: string;
}

interface RecentPostsProps {
  artistId: string;
  refreshTrigger?: number;
}

export function RecentPosts({ artistId, refreshTrigger }: RecentPostsProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, [artistId, refreshTrigger]);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('artist_posts')
      .select('id, title, content, visibility, created_at')
      .eq('artist_id', artistId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) setPosts(data);
    setLoading(false);
  };

  if (loading) {
    return <Card className="p-6"><p className="text-muted-foreground">Loading...</p></Card>;
  }

  if (posts.length === 0) {
    return (
      <EmptyStateCard
        icon={MessageSquare}
        title="No posts yet"
        description="Share an update with your fans to keep them engaged."
        ctaText="Create Post"
        ctaPath="/studio"
        variant="gold"
      />
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-card/80 border-border/50">
      <h3 className="text-lg font-semibold mb-6">Recent Posts</h3>
      <div className="space-y-4">
        {posts.map((post) => {
          const isExpanded = expandedPost === post.id;
          return (
            <button
              key={post.id}
              onClick={() => setExpandedPost(isExpanded ? null : post.id)}
              className="w-full text-left p-4 rounded-lg border border-border/50 hover:bg-muted/20 hover:border-primary/20 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                {post.title && (
                  <p className="font-medium text-base">{post.title}</p>
                )}
                <Badge 
                  variant={post.visibility === 'public' ? 'default' : 'secondary'} 
                  className={cn(
                    "flex-shrink-0",
                    post.visibility === 'public' && "bg-primary/20 text-primary border-primary/30"
                  )}
                >
                  {post.visibility === 'public' ? (
                    <><Globe className="h-3 w-3 mr-1" /> Public</>
                  ) : (
                    <><Users className="h-3 w-3 mr-1" /> Followers</>
                  )}
                </Badge>
              </div>
              <p className={cn(
                "text-sm text-muted-foreground mb-3",
                !isExpanded && "line-clamp-2"
              )}>
                {post.content}
              </p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground/70">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </p>
                <p className="text-xs text-primary">
                  {isExpanded ? "Show less" : "Read more"}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
