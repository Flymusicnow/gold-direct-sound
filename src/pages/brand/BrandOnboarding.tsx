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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, ArrowRight, ArrowLeft, Check, X, Briefcase, SkipForward, Upload, AlertCircle } from "lucide-react";
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

const OPPORTUNITY_TYPES = [
  { value: "festival_slot", label: "Festival Slot" },
  { value: "live_event", label: "Live Event" },
  { value: "brand_campaign", label: "Brand Campaign" },
  { value: "sponsorship", label: "Sponsorship" },
  { value: "ugc_content", label: "UGC Content" },
];

interface ValidationErrors {
  name?: string;
  type?: string;
}

export default function BrandOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [entityId, setEntityId] = useState<string | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
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
    logoUrl: "",
  });

  const [opportunityData, setOpportunityData] = useState({
    title: "",
    type: "",
    description: "",
    budgetRange: "",
    deadline: "",
  });

  const totalSteps = 4;

  const validateStep1 = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Company name is required";
    }
    
    if (!formData.type) {
      newErrors.type = "Company type is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Logo must be less than 2MB");
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile || !user) return null;
    
    setUploadingLogo(true);
    try {
      const fileExt = logoFile.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `brand-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("entity-icons")
        .upload(filePath, logoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("entity-icons")
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Failed to upload logo");
      return null;
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!validateStep1()) {
        return;
      }
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

  const createEntity = async () => {
    if (!user) return null;
    
    // Upload logo if present
    let logoUrl = formData.logoUrl;
    if (logoFile) {
      const uploadedUrl = await uploadLogo();
      if (uploadedUrl) {
        logoUrl = uploadedUrl;
      }
    }

    const slug = formData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

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
        logo_url: logoUrl || null,
        is_active: true,
      })
      .select()
      .single();

    if (entityError) throw entityError;

    const { error: adminError } = await supabase
      .from("collab_entity_admins")
      .insert({
        collab_entity_id: entity.id,
        user_id: user.id,
        role: "owner",
      });

    if (adminError) throw adminError;

    return entity.id;
  };

  const handleCompleteWithOpportunity = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let createdEntityId = entityId;
      
      if (!createdEntityId) {
        createdEntityId = await createEntity();
        setEntityId(createdEntityId);
      }

      if (opportunityData.title && opportunityData.type && createdEntityId) {
        await supabase.from("collab_opportunities").insert({
          collab_entity_id: createdEntityId,
          title: opportunityData.title,
          type: opportunityData.type,
          description: opportunityData.description || null,
          budget_range: opportunityData.budgetRange || null,
          application_deadline: opportunityData.deadline || null,
          is_active: true,
        });
      }

      toast.success("Brand profile created successfully!");
      navigate("/brand");
    } catch (error: any) {
      console.error("Error creating brand:", error);
      toast.error(error.message || "Failed to create brand profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSkipOpportunity = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      if (!entityId) {
        await createEntity();
      }

      toast.success("Brand profile created successfully!");
      navigate("/brand");
    } catch (error: any) {
      console.error("Error creating brand:", error);
      toast.error(error.message || "Failed to create brand profile");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const createdId = await createEntity();
      setEntityId(createdId);
      // Move to step 4 for opportunity creation
      setStep(4);
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
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-colors ${
                i + 1 === step ? "bg-primary" : i + 1 < step ? "bg-primary/50" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {step < 4 ? (
                <Building2 className="h-5 w-5 text-primary" />
              ) : (
                <Briefcase className="h-5 w-5 text-primary" />
              )}
              {step === 1 && "Company Information"}
              {step === 2 && "Brand Profile"}
              {step === 3 && "Collaboration Preferences"}
              {step === 4 && "Create Your First Opportunity (Optional)"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 && (
              <>
                {/* Logo Upload */}
                <div className="space-y-3">
                  <Label>Company Logo</Label>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20 rounded-xl">
                      <AvatarImage src={logoPreview || undefined} />
                      <AvatarFallback className="rounded-xl text-xl bg-muted">
                        {formData.name ? formData.name.charAt(0) : <Upload className="h-6 w-6" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Max 2MB. Recommended: 400x400px
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter your company name"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, name: e.target.value }));
                      if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
                    }}
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Company Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, type: value }));
                      if (errors.type) setErrors(prev => ({ ...prev, type: undefined }));
                    }}
                  >
                    <SelectTrigger className={errors.type ? "border-destructive" : ""}>
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
                  {errors.type && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.type}
                    </p>
                  )}
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
                      <SelectItem value="low">Under 5,000 SEK</SelectItem>
                      <SelectItem value="medium">5,000 - 25,000 SEK</SelectItem>
                      <SelectItem value="high">25,000 - 100,000 SEK</SelectItem>
                      <SelectItem value="enterprise">Over 100,000 SEK</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Post your first opportunity to start attracting artists. You can skip this and create opportunities later.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="oppTitle">Opportunity Title</Label>
                  <Input
                    id="oppTitle"
                    placeholder="e.g., Summer Festival Main Stage"
                    value={opportunityData.title}
                    onChange={(e) => setOpportunityData(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="oppType">Opportunity Type</Label>
                  <Select
                    value={opportunityData.type}
                    onValueChange={(value) => setOpportunityData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {OPPORTUNITY_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="oppDesc">Description</Label>
                  <Textarea
                    id="oppDesc"
                    placeholder="Describe the opportunity and what you're looking for..."
                    value={opportunityData.description}
                    onChange={(e) => setOpportunityData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="oppBudget">Budget Range</Label>
                    <Select
                      value={opportunityData.budgetRange}
                      onValueChange={(value) => setOpportunityData(prev => ({ ...prev, budgetRange: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select budget" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Under 5,000 SEK</SelectItem>
                        <SelectItem value="medium">5,000 - 25,000 SEK</SelectItem>
                        <SelectItem value="high">25,000 - 100,000 SEK</SelectItem>
                        <SelectItem value="enterprise">Over 100,000 SEK</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="oppDeadline">Application Deadline</Label>
                    <Input
                      id="oppDeadline"
                      type="date"
                      value={opportunityData.deadline}
                      onChange={(e) => setOpportunityData(prev => ({ ...prev, deadline: e.target.value }))}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
              {step > 1 && step < 4 ? (
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              ) : (
                <div />
              )}

              {step < 3 && (
                <Button onClick={handleNext} className="bg-gradient-gold">
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}

              {step === 3 && (
                <Button
                  onClick={handleComplete}
                  disabled={loading || uploadingLogo}
                  className="bg-gradient-gold"
                >
                  {loading || uploadingLogo ? "Creating..." : "Continue"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}

              {step === 4 && (
                <div className="flex gap-2 w-full justify-end">
                  <Button
                    variant="outline"
                    onClick={handleSkipOpportunity}
                    disabled={loading}
                  >
                    <SkipForward className="h-4 w-4 mr-2" />
                    Skip & Finish
                  </Button>
                  <Button
                    onClick={handleCompleteWithOpportunity}
                    disabled={loading || !opportunityData.title || !opportunityData.type}
                    className="bg-gradient-gold"
                  >
                    {loading ? "Creating..." : "Create & Finish"}
                    <Check className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
