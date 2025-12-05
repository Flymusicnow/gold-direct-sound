import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { BrandSidebar } from "@/components/brand/BrandSidebar";
import { BottomNavBarBrand } from "@/components/mobile/BottomNavBarBrand";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { BillingManagementCard } from "@/components/billing/BillingManagementCard";

const COLLAB_TYPES = [
  "ugc_content",
  "live_event",
  "festival_slot",
  "brand_ambassador",
  "sponsored_content",
  "product_placement",
];

const GENRES = [
  "Pop", "Hip-Hop", "Electronic", "R&B", "Rock", "Indie", "Jazz", "Classical", "Latin", "Country"
];

interface BrandEntity {
  id: string;
  name: string;
  type: string;
  location: string | null;
  website: string | null;
  mission: string | null;
  brand_values: string | null;
  collab_types: string[] | null;
  style_tags: string[] | null;
  budget_range: string | null;
}

export default function BrandSettings() {
  const { user } = useAuth();
  const [entity, setEntity] = useState<BrandEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    location: "",
    website: "",
    mission: "",
    brandValues: "",
    collabTypes: [] as string[],
    styleGenres: [] as string[],
    budgetRange: "",
  });

  useEffect(() => {
    if (user) {
      loadEntity();
    }
  }, [user]);

  const loadEntity = async () => {
    if (!user) return;

    try {
      const { data: adminData } = await supabase
        .from("collab_entity_admins")
        .select("collab_entity_id")
        .eq("user_id", user.id)
        .single();

      if (!adminData) return;

      const { data: entityData } = await supabase
        .from("collab_entities")
        .select("*")
        .eq("id", adminData.collab_entity_id)
        .single();

      if (entityData) {
        setEntity(entityData);
        setFormData({
          name: entityData.name || "",
          type: entityData.type || "",
          location: entityData.location || "",
          website: entityData.website || "",
          mission: entityData.mission || "",
          brandValues: entityData.brand_values || "",
          collabTypes: entityData.collab_types || [],
          styleGenres: entityData.style_tags || [],
          budgetRange: entityData.budget_range || "",
        });
      }
    } catch (error) {
      console.error("Error loading entity:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCollabType = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      collabTypes: prev.collabTypes.includes(type)
        ? prev.collabTypes.filter((t) => t !== type)
        : [...prev.collabTypes, type],
    }));
  };

  const toggleGenre = (genre: string) => {
    setFormData((prev) => ({
      ...prev,
      styleGenres: prev.styleGenres.includes(genre)
        ? prev.styleGenres.filter((g) => g !== genre)
        : [...prev.styleGenres, genre],
    }));
  };

  const handleSave = async () => {
    if (!entity) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("collab_entities")
        .update({
          name: formData.name,
          type: formData.type,
          location: formData.location || null,
          website: formData.website || null,
          mission: formData.mission || null,
          brand_values: formData.brandValues || null,
          collab_types: formData.collabTypes.length > 0 ? formData.collabTypes : null,
          style_tags: formData.styleGenres.length > 0 ? formData.styleGenres : null,
          budget_range: formData.budgetRange || null,
        })
        .eq("id", entity.id);

      if (error) throw error;

      toast.success("Settings saved!");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex w-full">
      <BrandSidebar />

      <main className="flex-1 p-6 pb-24 md:pb-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Manage your brand profile and preferences
            </p>
          </div>

          {/* Company Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Company Profile
              </CardTitle>
              <CardDescription>
                Update your company information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Company Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brand">Brand</SelectItem>
                      <SelectItem value="festival">Festival</SelectItem>
                      <SelectItem value="sponsor">Sponsor</SelectItem>
                      <SelectItem value="event_agency">Event Agency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, location: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, website: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mission">Mission Statement</Label>
                <Textarea
                  id="mission"
                  value={formData.mission}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, mission: e.target.value }))
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brandValues">Brand Values</Label>
                <Textarea
                  id="brandValues"
                  value={formData.brandValues}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, brandValues: e.target.value }))
                  }
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Collaboration Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Collaboration Preferences</CardTitle>
              <CardDescription>
                Define what types of collaborations you're interested in
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Collaboration Types</Label>
                <div className="flex flex-wrap gap-2">
                  {COLLAB_TYPES.map((type) => (
                    <Badge
                      key={type}
                      variant={formData.collabTypes.includes(type) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleCollabType(type)}
                    >
                      {type.replace(/_/g, " ")}
                      {formData.collabTypes.includes(type) && (
                        <X className="h-3 w-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Preferred Genres</Label>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map((genre) => (
                    <Badge
                      key={genre}
                      variant={formData.styleGenres.includes(genre) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleGenre(genre)}
                    >
                      {genre}
                      {formData.styleGenres.includes(genre) && (
                        <X className="h-3 w-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">Budget Range</Label>
                <Select
                  value={formData.budgetRange}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, budgetRange: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select budget range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="< 5,000 SEK">Under 5,000 SEK</SelectItem>
                    <SelectItem value="5,000 - 25,000 SEK">5,000 - 25,000 SEK</SelectItem>
                    <SelectItem value="25,000 - 100,000 SEK">25,000 - 100,000 SEK</SelectItem>
                    <SelectItem value="> 100,000 SEK">Over 100,000 SEK</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Billing */}
          <BillingManagementCard userType="artist" />

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-gold">
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </main>

      <BottomNavBarBrand />
    </div>
  );
}
