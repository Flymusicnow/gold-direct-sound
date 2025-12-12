import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Building2, CheckCircle, ArrowLeft, X } from "lucide-react";
import { Link } from "react-router-dom";
import { FlyMusicLogo } from "@/components/FlyMusicLogo";

const COMPANY_TYPES = [
  "Record Label",
  "Brand/Sponsor",
  "Festival/Event",
  "Venue",
  "Agency",
  "Media/Publication",
  "Other",
];

const BUDGET_RANGES = [
  "Under $5,000",
  "$5,000 - $15,000",
  "$15,000 - $50,000",
  "$50,000 - $100,000",
  "Over $100,000",
  "TBD/Flexible",
];

const GENRE_OPTIONS = [
  "Pop", "Hip-Hop", "R&B", "Electronic", "Rock", "Indie", "Country", "Latin", "Jazz", "Classical", "Other"
];

export default function BrandApply() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    website: "",
    companyType: "",
    intendedUse: "",
    campaignGoals: "",
    budgetRange: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { error } = await (supabase.from("brand_applications") as any).insert({
        company_name: formData.companyName,
        contact_person: formData.contactPerson,
        email: formData.email,
        phone: formData.phone || null,
        website: formData.website || null,
        company_type: formData.companyType,
        intended_use: formData.intendedUse || null,
        campaign_goals: formData.campaignGoals || null,
        target_genres: selectedGenres,
        budget_range: formData.budgetRange || null,
      });

      if (error) throw error;
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isStep1Valid = formData.companyName && formData.contactPerson && formData.email && formData.companyType;
  const isStep2Valid = true; // Optional fields

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
            <p className="text-muted-foreground mb-6">
              Thank you for your interest in partnering with FlyMusic Gold. We'll review your application and get back to you within 3-5 business days.
            </p>
            <Link to="/">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <FlyMusicLogo size="sm" />
            <span className="font-bold text-lg">FlyMusic Gold</span>
          </Link>
          <Link to="/brands">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Partner with FlyMusic</h1>
          <p className="text-muted-foreground">
            Complete this form to apply for brand partnership access
          </p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          <div className={`flex-1 h-1 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
          <div className={`flex-1 h-1 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 ? "Company Information" : "Partnership Goals"}
            </CardTitle>
            <CardDescription>
              {step === 1 ? "Tell us about your company" : "Help us understand your needs"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleChange("companyName", e.target.value)}
                    placeholder="Your company name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyType">Company Type *</Label>
                  <Select value={formData.companyType} onValueChange={(v) => handleChange("companyType", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company type" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPANY_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person *</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => handleChange("contactPerson", e.target.value)}
                    placeholder="Your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="email@company.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website (optional)</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleChange("website", e.target.value)}
                      placeholder="https://yourcompany.com"
                    />
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => setStep(2)}
                  disabled={!isStep1Valid}
                >
                  Continue
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="intendedUse">What would you like to use FlyMusic for?</Label>
                  <Textarea
                    id="intendedUse"
                    value={formData.intendedUse}
                    onChange={(e) => handleChange("intendedUse", e.target.value)}
                    placeholder="Describe how you plan to partner with artists..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaignGoals">Campaign Goals</Label>
                  <Textarea
                    id="campaignGoals"
                    value={formData.campaignGoals}
                    onChange={(e) => handleChange("campaignGoals", e.target.value)}
                    placeholder="What are your goals for artist partnerships?"
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Target Genres (optional)</Label>
                  <div className="flex flex-wrap gap-2">
                    {GENRE_OPTIONS.map((genre) => (
                      <Badge
                        key={genre}
                        variant={selectedGenres.includes(genre) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleGenre(genre)}
                      >
                        {genre}
                        {selectedGenres.includes(genre) && <X className="h-3 w-3 ml-1" />}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budgetRange">Estimated Budget Range</Label>
                  <Select value={formData.budgetRange} onValueChange={(v) => handleChange("budgetRange", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select budget range" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUDGET_RANGES.map((range) => (
                        <SelectItem key={range} value={range}>{range}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    Back
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? "Submitting..." : "Submit Application"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
