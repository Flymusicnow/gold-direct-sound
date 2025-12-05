import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, ArrowRight, ArrowLeft, Check, X } from "lucide-react";
import { toast } from "sonner";
import { FlyMusicLogo } from "@/components/FlyMusicLogo";

const ENTITY_TYPES = [
  { value: "brand", label: "Brand" },
  { value: "festival", label: "Festival" },
  { value: "sponsor", label: "Sponsor" },
  { value: "event_agency", label: "Event Agency" },
];

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

export default function BrandOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
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

  const handleNext = () => {
    if (step === 1 && (!formData.name || !formData.type)) {
      toast.error("Please fill in required fields");
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const toggleCollabType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      collabTypes: prev.collabTypes.includes(type)
        ? prev.collabTypes.filter(t => t !== type)
        : [...prev.collabTypes, type]
    }));
  };

  const toggleGenre = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      styleGenres: prev.styleGenres.includes(genre)
        ? prev.styleGenres.filter(g => g !== genre)
        : [...prev.styleGenres, genre]
    }));
  };

  const handleComplete = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Generate slug from name
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      // Create collab entity
      const { data: entity, error: entityError } = await supabase
        .from("collab_entities")
        .insert({
          name: formData.name,
          slug,
          type: formData.type,
          location: formData.location || null,
          website: formData.website || null,
          mission: formData.mission || null,
          brand_values: formData.brandValues || null,
          collab_types: formData.collabTypes.length > 0 ? formData.collabTypes : null,
          style_tags: formData.styleGenres.length > 0 ? formData.styleGenres : null,
          budget_range: formData.budgetRange || null,
          is_active: true,
        })
        .select()
        .single();

      if (entityError) throw entityError;

      // Link user as admin
      const { error: adminError } = await supabase
        .from("collab_entity_admins")
        .insert({
          collab_entity_id: entity.id,
          user_id: user.id,
          role: "owner",
        });

      if (adminError) throw adminError;

      toast.success("Brand profile created successfully!");
      navigate("/brand");
    } catch (error: any) {
      console.error("Error creating brand:", error);
      toast.error(error.message || "Failed to create brand profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FlyMusicLogo size="md" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome to Brand Portal</h1>
          <p className="text-muted-foreground">
            Set up your brand profile to connect with independent artists
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-3 h-3 rounded-full transition-colors ${
                s === step ? "bg-primary" : s < step ? "bg-primary/50" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {step === 1 && "Company Information"}
              {step === 2 && "Brand Profile"}
              {step === 3 && "Collaboration Preferences"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter your company name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Company Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select company type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTITY_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="City, Country"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://yourcompany.com"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="mission">Mission Statement</Label>
                  <Textarea
                    id="mission"
                    placeholder="What does your company stand for?"
                    value={formData.mission}
                    onChange={(e) => setFormData(prev => ({ ...prev, mission: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brandValues">Brand Values</Label>
                  <Textarea
                    id="brandValues"
                    placeholder="What values guide your partnerships?"
                    value={formData.brandValues}
                    onChange={(e) => setFormData(prev => ({ ...prev, brandValues: e.target.value }))}
                    rows={3}
                  />
                </div>
              </>
            )}

            {step === 3 && (
              <>
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
                    onValueChange={(value) => setFormData(prev => ({ ...prev, budgetRange: value }))}
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
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
              {step > 1 ? (
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <Button onClick={handleNext} className="bg-gradient-gold">
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  disabled={loading}
                  className="bg-gradient-gold"
                >
                  {loading ? "Creating..." : "Complete Setup"}
                  <Check className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
