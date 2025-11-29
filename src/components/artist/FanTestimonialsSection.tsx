import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FanTestimonialCard } from "./FanTestimonialCard";
import { SubmitTestimonialDialog } from "./SubmitTestimonialDialog";
import { Button } from "@/components/ui/button";
import { MessageSquare, Sparkles } from "lucide-react";

interface FanTestimonialsSectionProps {
  artistId: string;
}

export function FanTestimonialsSection({ artistId }: FanTestimonialsSectionProps) {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    fetchTestimonials();
    checkFollowStatus();
  }, [artistId]);

  const fetchTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from("fan_testimonials")
        .select("*")
        .eq("artist_id", artistId)
        .eq("status", "approved")
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;

      // Fetch user profiles separately
      if (data && data.length > 0) {
        const userIds = data.map(t => t.fan_user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        const testimonialsWithProfiles = data.map(t => ({
          ...t,
          profiles: profileMap.get(t.fan_user_id),
        }));
        setTestimonials(testimonialsWithProfiles);
      } else {
        setTestimonials([]);
      }
    } catch (error) {
      console.error("Error fetching testimonials:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("follows")
      .select("id")
      .eq("artist_id", artistId)
      .eq("fan_id", user.id)
      .maybeSingle();

    setIsFollowing(!!data);
  };

  if (loading) return null;
  if (testimonials.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-bold">Fan Testimonials</h2>
        </div>
        {isFollowing && (
          <Button
            onClick={() => setShowDialog(true)}
            className="gap-2"
            variant="outline"
          >
            <MessageSquare className="w-4 h-4" />
            Leave a Review
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {testimonials.map((testimonial) => (
          <FanTestimonialCard key={testimonial.id} testimonial={testimonial} />
        ))}
      </div>

      <SubmitTestimonialDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        artistId={artistId}
        onSuccess={fetchTestimonials}
      />
    </div>
  );
}
