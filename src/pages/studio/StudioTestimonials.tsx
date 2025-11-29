import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StudioSidebar } from "@/components/artist/StudioSidebar";
import { MobileStudioNav } from "@/components/artist/MobileStudioNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Star, Check, X, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Testimonial {
  id: string;
  testimonial_text: string;
  rating: number;
  status: string;
  is_featured: boolean;
  created_at: string;
  profiles?: {
    full_name: string | null;
  };
}

export default function StudioTestimonials() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [artistId, setArtistId] = useState<string | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      fetchData();
    };
    checkAuth();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("artist_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) {
        navigate("/role-selection");
        return;
      }

      setArtistId(profile.id);

      const { data, error } = await supabase
        .from("fan_testimonials")
        .select("*")
        .eq("artist_id", profile.id)
        .order("created_at", { ascending: false });

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

      if (error) throw error;
      setTestimonials(data || []);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      toast({
        title: "Error",
        description: "Failed to load testimonials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from("fan_testimonials")
        .update({ status: "approved" })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Testimonial approved",
        description: "The testimonial is now visible on your profile",
      });

      fetchData();
    } catch (error) {
      console.error("Error approving testimonial:", error);
      toast({
        title: "Error",
        description: "Failed to approve testimonial",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (id: string) => {
    try {
      const { error } = await supabase
        .from("fan_testimonials")
        .update({ status: "rejected" })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Testimonial rejected",
        description: "The testimonial has been hidden",
      });

      fetchData();
    } catch (error) {
      console.error("Error rejecting testimonial:", error);
      toast({
        title: "Error",
        description: "Failed to reject testimonial",
        variant: "destructive",
      });
    }
  };

  const handleToggleFeatured = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("fan_testimonials")
        .update({ is_featured: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: currentStatus ? "Removed from featured" : "Added to featured",
        description: currentStatus
          ? "The testimonial is no longer featured"
          : "The testimonial is now featured on your profile",
      });

      fetchData();
    } catch (error) {
      console.error("Error toggling featured status:", error);
      toast({
        title: "Error",
        description: "Failed to update featured status",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingTestimonials = testimonials.filter((t) => t.status === "pending");
  const approvedTestimonials = testimonials.filter((t) => t.status === "approved");
  const rejectedTestimonials = testimonials.filter((t) => t.status === "rejected");

  return (
    <div className="flex min-h-screen bg-background">
      <StudioSidebar />

      <div className="flex-1 lg:ml-64">
        <MobileStudioNav />

        <main className="container mx-auto px-4 py-8 pt-20 lg:pt-24">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Fan Testimonials</h1>
            <p className="text-muted-foreground">
              Manage reviews from your fans
            </p>
          </div>

          {testimonials.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <MessageSquare className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No testimonials yet</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  When fans leave reviews on your profile, they'll appear here for you to approve and feature.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {pendingTestimonials.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Badge variant="secondary">{pendingTestimonials.length}</Badge>
                    Pending Review
                  </h2>
                  <div className="grid gap-4">
                    {pendingTestimonials.map((testimonial) => (
                      <Card key={testimonial.id} className="bg-card/50 border-primary/20">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-medium text-primary">
                                  {testimonial.profiles?.full_name?.[0]?.toUpperCase() || "F"}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium">
                                  {testimonial.profiles?.full_name || "Fan"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(testimonial.created_at), {
                                    addSuffix: true,
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < testimonial.rating
                                      ? "fill-primary text-primary"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-foreground leading-relaxed mb-4">
                            {testimonial.testimonial_text}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(testimonial.id)}
                              className="gap-2"
                            >
                              <Check className="w-4 h-4" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(testimonial.id)}
                              className="gap-2"
                            >
                              <X className="w-4 h-4" />
                              Reject
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {approvedTestimonials.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Approved Testimonials</h2>
                  <div className="grid gap-4">
                    {approvedTestimonials.map((testimonial) => (
                      <Card key={testimonial.id} className="bg-card/50">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-medium text-primary">
                                  {testimonial.profiles?.full_name?.[0]?.toUpperCase() || "F"}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium">
                                  {testimonial.profiles?.full_name || "Fan"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(testimonial.created_at), {
                                    addSuffix: true,
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {testimonial.is_featured && (
                                <Badge className="bg-primary/20 text-primary border-primary/30">
                                  Featured
                                </Badge>
                              )}
                              <div className="flex gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < testimonial.rating
                                        ? "fill-primary text-primary"
                                        : "text-muted-foreground"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-foreground leading-relaxed mb-4">
                            {testimonial.testimonial_text}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={testimonial.is_featured ? "outline" : "default"}
                              onClick={() =>
                                handleToggleFeatured(testimonial.id, testimonial.is_featured)
                              }
                            >
                              {testimonial.is_featured ? "Unfeature" : "Feature on Profile"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleReject(testimonial.id)}
                            >
                              Hide
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {rejectedTestimonials.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4 text-muted-foreground">
                    Hidden Testimonials
                  </h2>
                  <div className="grid gap-4">
                    {rejectedTestimonials.map((testimonial) => (
                      <Card key={testimonial.id} className="bg-card/20 opacity-60">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                <span className="text-sm font-medium">
                                  {testimonial.profiles?.full_name?.[0]?.toUpperCase() || "F"}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium">
                                  {testimonial.profiles?.full_name || "Fan"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(testimonial.created_at), {
                                    addSuffix: true,
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm leading-relaxed mb-4">
                            {testimonial.testimonial_text}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(testimonial.id)}
                          >
                            Restore
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
