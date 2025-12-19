import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useArtistVerification } from "@/hooks/useArtistVerification";
import { StudioSidebar } from "@/components/artist/StudioSidebar";
import { MobileStudioNav } from "@/components/artist/MobileStudioNav";
import { BottomNavBarStudio } from "@/components/mobile/BottomNavBarStudio";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BadgeCheck, Upload, Clock, CheckCircle2, XCircle, AlertCircle, Shield } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export default function StudioVerification() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { verification, loading, isVerified, submitVerification } = useArtistVerification();
  
  const [documentUrl, setDocumentUrl] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!documentUrl.trim()) {
      toast.error("Please provide a document URL");
      return;
    }

    setSubmitting(true);
    
    const result = await submitVerification([documentUrl]);
    
    if (result.success) {
      toast.success("Verification request submitted successfully!");
    } else {
      toast.error(result.error || "Failed to submit verification request");
    }
    
    setSubmitting(false);
  };

  const getStatusBadge = () => {
    if (!verification) return null;

    switch (verification.verification_status) {
      case "verified":
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/30 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Verified
          </Badge>
        );
      case "submitted":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30 gap-1">
            <Clock className="h-3 w-3" />
            Under Review
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/30 gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-muted text-muted-foreground gap-1">
            <AlertCircle className="h-3 w-3" />
            Pending
          </Badge>
        );
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
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <div className="flex">
        <StudioSidebar />
        <MobileStudioNav />

        <main className="flex-1 md:ml-64 pt-20 md:pt-8 px-4 md:px-8">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <BadgeCheck className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Artist Verification</h1>
                <p className="text-muted-foreground">Get verified to build trust with your fans</p>
              </div>
            </div>

            {/* Current Status */}
            {verification && (
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Verification Status</CardTitle>
                    {getStatusBadge()}
                  </div>
                </CardHeader>
                <CardContent>
                  {verification.verification_status === "verified" && (
                    <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="font-semibold text-green-500">You're Verified!</p>
                        <p className="text-sm text-muted-foreground">
                          Your profile now displays the verified badge.
                        </p>
                      </div>
                    </div>
                  )}

                  {verification.verification_status === "submitted" && (
                    <div className="flex items-center gap-3 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                      <Clock className="h-8 w-8 text-yellow-500" />
                      <div>
                        <p className="font-semibold text-yellow-500">Under Review</p>
                        <p className="text-sm text-muted-foreground">
                          We're reviewing your verification request. This usually takes 1-3 business days.
                        </p>
                      </div>
                    </div>
                  )}

                  {verification.verification_status === "rejected" && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-red-500/10 rounded-lg border border-red-500/30">
                        <XCircle className="h-8 w-8 text-red-500" />
                        <div>
                          <p className="font-semibold text-red-500">Verification Rejected</p>
                          <p className="text-sm text-muted-foreground">
                            {verification.rejection_reason || "Your verification request was not approved."}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        You can submit a new verification request below.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Verification Form */}
            {(!verification || verification.verification_status === "rejected" || verification.verification_status === "pending") && (
              <Card>
                <CardHeader>
                  <CardTitle>Request Verification</CardTitle>
                  <CardDescription>
                    Submit documents to verify your identity as an artist
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Benefits */}
                    <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        Benefits of Verification
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                        <li>• Blue verified badge on your profile</li>
                        <li>• Increased trust from fans and brands</li>
                        <li>• Priority consideration for opportunities</li>
                        <li>• Enhanced visibility in search results</li>
                      </ul>
                    </div>

                    {/* Document Upload */}
                    <div className="space-y-2">
                      <Label htmlFor="document">Document URL *</Label>
                      <Input
                        id="document"
                        type="url"
                        placeholder="Link to your ID or proof document"
                        value={documentUrl}
                        onChange={(e) => setDocumentUrl(e.target.value)}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Provide a link to a government-issued ID, artist press kit, or official documentation.
                        You can use Google Drive, Dropbox, or any file sharing service.
                      </p>
                    </div>

                    {/* Additional Info */}
                    <div className="space-y-2">
                      <Label htmlFor="info">Additional Information (Optional)</Label>
                      <Textarea
                        id="info"
                        placeholder="Any additional context to help verify your identity..."
                        value={additionalInfo}
                        onChange={(e) => setAdditionalInfo(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? "Submitting..." : "Submit Verification Request"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      {isMobile && <BottomNavBarStudio />}
    </div>
  );
}
