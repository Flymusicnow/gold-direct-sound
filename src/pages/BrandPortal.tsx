import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Music, 
  Users, 
  TrendingUp, 
  Sparkles, 
  Target,
  Handshake,
  BarChart3,
  Globe,
  Mail,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { FlyMusicLogo } from "@/components/FlyMusicLogo";
import { Link } from "react-router-dom";
import { z } from "zod";

const contactSchema = z.object({
  company_name: z.string().trim().min(1, "Company name is required").max(100),
  contact_name: z.string().trim().min(1, "Contact name is required").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  company_type: z.string().min(1, "Please select a company type"),
  message: z.string().trim().max(2000).optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function BrandPortal() {
  const [formData, setFormData] = useState<ContactFormData>({
    company_name: "",
    contact_name: "",
    email: "",
    company_type: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      toast({
        title: "Validation Error",
        description: result.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("beta_waitlist").insert({
        email: formData.email,
        name: `${formData.contact_name} (${formData.company_name})`,
        user_type: "brand",
        message: `Company Type: ${formData.company_type}\n\n${formData.message || "No message provided"}`,
        status: "pending",
      });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "Request Submitted",
        description: "We'll be in touch soon to discuss partnership opportunities.",
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = [
    { label: "Rising Artists", value: "500+", icon: Music },
    { label: "Active Fans", value: "10K+", icon: Users },
    { label: "Monthly Engagement", value: "1M+", icon: TrendingUp },
  ];

  const benefits = [
    {
      icon: Target,
      title: "Precision Matching",
      description: "Our algorithm matches your brand with artists whose audience and values align perfectly with your goals.",
    },
    {
      icon: BarChart3,
      title: "Data-Driven Insights",
      description: "Access detailed analytics on artist engagement, fan demographics, and campaign performance.",
    },
    {
      icon: Handshake,
      title: "Direct Relationships",
      description: "Connect directly with independent artists without intermediaries or agency fees.",
    },
    {
      icon: Sparkles,
      title: "Authentic Content",
      description: "Partner with genuine creators who build real connections with their audiences.",
    },
  ];

  const partnerTypes = [
    { value: "brand", label: "Brand / Company" },
    { value: "festival", label: "Festival / Event" },
    { value: "sponsor", label: "Sponsor" },
    { value: "agency", label: "Agency" },
    { value: "other", label: "Other" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <FlyMusicLogo size="sm" />
              <span className="text-lg font-semibold text-foreground">FlyMusic</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Sign In
              </Link>
              <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
                <a href="#contact">Get Started</a>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 border-primary/50 text-primary">
            <Building2 className="w-3 h-3 mr-1" />
            Brand Portal
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Connect Your Brand with
            <span className="text-primary block mt-2">Rising Music Talent</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
            FlyMusic connects brands, festivals, and sponsors with authentic independent artists 
            and their engaged fan communities. Build meaningful partnerships that resonate.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <a href="#contact">
                Start Partnership
                <ArrowRight className="ml-2 w-4 h-4" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#how-it-works">Learn More</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-card/50">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat) => (
              <Card key={stat.label} className="bg-background/50 border-border/50">
                <CardContent className="p-6 text-center">
                  <stat.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                  <div className="text-3xl font-bold text-primary mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Why Partner with FlyMusic?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Access a curated ecosystem of independent artists and their dedicated fan communities.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit) => (
              <Card key={benefit.title} className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-8">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Partnership Types */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Partnership Opportunities
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Whether you're a brand, festival, or sponsor, we have partnership models that fit your goals.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-background border-border/50">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Brands</h3>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    Sponsored artist campaigns
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    Product placement in content
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    Brand ambassador programs
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-background border-primary/30 ring-1 ring-primary/20">
              <CardContent className="p-8">
                <Badge className="mb-4 bg-primary/10 text-primary border-0">Most Popular</Badge>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Festivals & Events</h3>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    Talent discovery & booking
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    Artist matching algorithm
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    Performance analytics
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-background border-border/50">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Handshake className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Sponsors</h3>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    Spotlight campaign sponsorship
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    Exclusive content partnerships
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    Community engagement programs
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Start a Partnership
            </h2>
            <p className="text-lg text-muted-foreground">
              Tell us about your organization and we'll explore how FlyMusic can help you connect with rising talent.
            </p>
          </div>

          {submitted ? (
            <Card className="bg-card/50 border-primary/30">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-3">Request Received</h3>
                <p className="text-muted-foreground mb-6">
                  Thank you for your interest in partnering with FlyMusic. 
                  Our team will review your request and get back to you within 2-3 business days.
                </p>
                <Button asChild variant="outline">
                  <Link to="/">Back to Homepage</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Company Name *</label>
                      <Input
                        placeholder="Your company"
                        value={formData.company_name}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                        required
                        maxLength={100}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Contact Name *</label>
                      <Input
                        placeholder="Your name"
                        value={formData.contact_name}
                        onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                        required
                        maxLength={100}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email *</label>
                    <Input
                      type="email"
                      placeholder="you@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      maxLength={255}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Organization Type *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {partnerTypes.map((type) => (
                        <Button
                          key={type.value}
                          type="button"
                          variant={formData.company_type === type.value ? "default" : "outline"}
                          size="sm"
                          className={formData.company_type === type.value ? "bg-primary text-primary-foreground" : ""}
                          onClick={() => setFormData({ ...formData, company_type: type.value })}
                        >
                          {type.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Message (Optional)</label>
                    <Textarea
                      placeholder="Tell us about your partnership goals..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={4}
                      maxLength={2000}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      "Submitting..."
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Submit Partnership Request
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    By submitting, you agree to our{" "}
                    <Link to="/legal/brand-portal-terms" className="text-primary hover:underline">
                      Brand Portal Terms
                    </Link>{" "}
                    and{" "}
                    <Link to="/legal/privacy-policy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FlyMusicLogo size="sm" />
            <span className="text-sm text-muted-foreground">© 2024 FlyMusic. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/legal/privacy-policy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/legal/brand-portal-terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
