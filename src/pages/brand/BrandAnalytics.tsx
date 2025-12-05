import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { BrandSidebar } from "@/components/brand/BrandSidebar";
import { BottomNavBarBrand } from "@/components/mobile/BottomNavBarBrand";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, Briefcase, TrendingUp, Eye, Heart } from "lucide-react";

export default function BrandAnalytics() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalOpportunities: 0,
    activeOpportunities: 0,
    totalApplications: 0,
    acceptedApplications: 0,
    totalInterests: 0,
    profileViews: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    if (!user) return;

    try {
      const { data: adminData } = await supabase
        .from("collab_entity_admins")
        .select("collab_entity_id")
        .eq("user_id", user.id)
        .single();

      if (!adminData) return;

      // Get opportunities
      const { data: opps, count: totalOpps } = await supabase
        .from("collab_opportunities")
        .select("*", { count: "exact" })
        .eq("collab_entity_id", adminData.collab_entity_id);

      const activeOpps = opps?.filter((o) => o.is_active).length || 0;

      // Get applications for these opportunities
      const oppIds = opps?.map((o) => o.id) || [];
      let totalApps = 0;
      let acceptedApps = 0;

      if (oppIds.length > 0) {
        const { data: apps, count } = await supabase
          .from("collab_applications")
          .select("*", { count: "exact" })
          .in("opportunity_id", oppIds);

        totalApps = count || 0;
        acceptedApps = apps?.filter((a) => a.status === "accepted").length || 0;
      }

      // Get interests
      const { count: interestsCount } = await supabase
        .from("collab_interest")
        .select("*", { count: "exact" })
        .eq("collab_entity_id", adminData.collab_entity_id);

      setStats({
        totalOpportunities: totalOpps || 0,
        activeOpportunities: activeOpps,
        totalApplications: totalApps,
        acceptedApplications: acceptedApps,
        totalInterests: interestsCount || 0,
        profileViews: 0, // Placeholder - would need view tracking
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Opportunities",
      value: stats.totalOpportunities,
      icon: Briefcase,
      description: `${stats.activeOpportunities} active`,
    },
    {
      title: "Applications Received",
      value: stats.totalApplications,
      icon: Users,
      description: `${stats.acceptedApplications} accepted`,
    },
    {
      title: "Artist Interests",
      value: stats.totalInterests,
      icon: Heart,
      description: "Artists you've expressed interest in",
    },
    {
      title: "Acceptance Rate",
      value: stats.totalApplications > 0 
        ? `${Math.round((stats.acceptedApplications / stats.totalApplications) * 100)}%`
        : "N/A",
      icon: TrendingUp,
      description: "Of applications accepted",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex w-full">
      <BrandSidebar />

      <main className="flex-1 p-6 pb-24 md:pb-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              Analytics
            </h1>
            <p className="text-muted-foreground">
              Track your partnership performance and reach
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                        <p className="text-3xl font-bold mt-1">{stat.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {stat.description}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Coming Soon */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Analytics</CardTitle>
            </CardHeader>
            <CardContent className="py-12 text-center">
              <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Detailed analytics with charts and trends coming soon
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNavBarBrand />
    </div>
  );
}
