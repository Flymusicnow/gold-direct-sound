import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Music, Upload, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function StudioOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    artistName: "",
    bio: "",
    genre: "",
  });

  const handleContinue = async () => {
    if (step === 1) {
      if (!formData.artistName) {
        toast.error("Please enter your artist name");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setLoading(true);
      try {
        // Create artist profile
        const { error } = await supabase
          .from('artist_profiles')
          .insert({
            user_id: user!.id,
            artist_name: formData.artistName,
            bio: formData.bio || null,
            genre: formData.genre || null,
            status: 'approved', // Auto-approve during beta
          });

        if (error) throw error;

        toast.success("Profile created successfully!");
        navigate('/studio');
      } catch (error: any) {
        console.error('Error creating profile:', error);
        toast.error(error.message || "Failed to create profile");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSkip = () => {
    navigate('/studio');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Music className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Welcome to My Studio</h1>
          </div>
          <p className="text-muted-foreground">
            Let's set up your artist profile in just 2 steps
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`h-2 w-16 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`h-2 w-16 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
        </div>

        {/* Step Content */}
        <Card className="p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Music className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Basic Information</h2>
                  <p className="text-sm text-muted-foreground">Tell us about yourself</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="artistName">Artist Name *</Label>
                  <Input
                    id="artistName"
                    value={formData.artistName}
                    onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                    placeholder="Your stage name"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="genre">Genre</Label>
                  <Input
                    id="genre"
                    value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                    placeholder="Hip Hop, Pop, Rock, etc."
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell your story..."
                    className="mt-2 min-h-24"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">All Set!</h2>
                  <p className="text-sm text-muted-foreground">Ready to start your journey</p>
                </div>
              </div>

              <div className="bg-muted/30 rounded-lg p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Upload className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Next Steps:</h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• Upload your first track</li>
                      <li>• Add profile picture and banner</li>
                      <li>• Share your profile with fans</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button variant="ghost" onClick={handleSkip}>
              Skip for now
            </Button>
            <Button
              onClick={handleContinue}
              disabled={loading}
              className="bg-gradient-gold"
            >
              {loading ? "Creating..." : step === 1 ? "Continue" : "Go to Studio"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
