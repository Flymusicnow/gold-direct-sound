import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Sparkles, Bug, Palette, Shield, Zap, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface PlatformUpdate {
  id: string;
  title: string;
  content: string;
  priority: string;
  category: string | null;
  link_url: string | null;
  published_at: string;
}

const categoryConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  feature: { icon: Sparkles, label: "Feature", color: "bg-blue-500/10 text-blue-500 border-blue-500/30" },
  bugfix: { icon: Bug, label: "Bug Fix", color: "bg-green-500/10 text-green-500 border-green-500/30" },
  ui: { icon: Palette, label: "UI/UX", color: "bg-purple-500/10 text-purple-500 border-purple-500/30" },
  security: { icon: Shield, label: "Security", color: "bg-red-500/10 text-red-500 border-red-500/30" },
  performance: { icon: Zap, label: "Performance", color: "bg-orange-500/10 text-orange-500 border-orange-500/30" },
};

export default function Changelog() {
  const [updates, setUpdates] = useState<PlatformUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchUpdates();
  }, []);

  const fetchUpdates = async () => {
    try {
      const { data, error } = await supabase
        .from("platform_updates")
        .select("id, title, content, priority, category, link_url, published_at")
        .eq("is_active", true)
        .eq("visibility", "public")
        .order("published_at", { ascending: false });

      if (!error && data) {
        setUpdates(data);
      }
    } catch (error) {
      console.error("Error fetching updates:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUpdates = updates.filter((update) => {
    const matchesSearch = 
      update.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      update.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || update.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group updates by month/year
  const groupedUpdates = filteredUpdates.reduce((acc, update) => {
    const date = parseISO(update.published_at);
    const key = format(date, "MMMM yyyy");
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(update);
    return acc;
  }, {} as Record<string, PlatformUpdate[]>);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getCategoryInfo = (category: string | null) => {
    return categoryConfig[category] || categoryConfig.feature;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Changelog
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Stay up to date with the latest improvements, features, and fixes to FlyMusic.
            </p>
          </div>

          {/* Filters */}
          <div className="mb-8 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search updates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                All
              </Button>
              {Object.entries(categoryConfig).map(([key, { icon: Icon, label }]) => (
                <Button
                  key={key}
                  variant={selectedCategory === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(key)}
                  className="gap-1"
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Updates Timeline */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading updates...</p>
            </div>
          ) : Object.keys(groupedUpdates).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No updates found.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedUpdates).map(([monthYear, monthUpdates]) => (
                <div key={monthYear}>
                  <h2 className="text-xl font-semibold mb-4 text-foreground sticky top-20 bg-background py-2 z-10">
                    {monthYear}
                  </h2>
                  <div className="space-y-4 border-l-2 border-border pl-6 ml-2">
                    {monthUpdates.map((update) => {
                      const { icon: CategoryIcon, label, color } = getCategoryInfo(update.category || 'feature');
                      const isExpanded = expandedIds.has(update.id);
                      const shouldTruncate = update.content.length > 200;

                      return (
                        <Card key={update.id} className="relative">
                          {/* Timeline dot */}
                          <div className="absolute -left-[31px] top-6 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                          
                          <CardContent className="p-4 md:p-6">
                            <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={cn("gap-1", color)}>
                                  <CategoryIcon className="h-3 w-3" />
                                  {label}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {format(parseISO(update.published_at), "MMM d, yyyy")}
                                </span>
                              </div>
                            </div>

                            <h3 className="text-lg font-semibold mb-2">{update.title}</h3>
                            
                            <p className="text-muted-foreground text-sm leading-relaxed">
                              {shouldTruncate && !isExpanded
                                ? `${update.content.slice(0, 200)}...`
                                : update.content}
                            </p>

                            <div className="flex items-center gap-2 mt-3">
                              {shouldTruncate && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleExpand(update.id)}
                                  className="text-xs h-7 px-2"
                                >
                                  {isExpanded ? (
                                    <>
                                      <ChevronUp className="h-3 w-3 mr-1" />
                                      Show less
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="h-3 w-3 mr-1" />
                                      Read more
                                    </>
                                  )}
                                </Button>
                              )}
                              {update.link_url && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  asChild
                                  className="text-xs h-7 px-2"
                                >
                                  <a href={update.link_url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    Learn more
                                  </a>
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
