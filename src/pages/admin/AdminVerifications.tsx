import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BadgeCheck, CheckCircle2, XCircle, Clock, ExternalLink, Search, User } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Verification {
  id: string;
  user_id: string;
  verification_status: string;
  submitted_at: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  verification_type: string;
  documents_url: string[] | null;
  created_at: string;
  artist_profile?: {
    artist_name: string;
    avatar_url: string | null;
    genre: string | null;
  };
}

export default function AdminVerifications() {
  const { user } = useAuth();
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("submitted");
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    try {
      const { data, error } = await supabase
        .from("artist_verifications")
        .select("*")
        .order("submitted_at", { ascending: false });

      if (error) throw error;

      // Fetch artist profiles for each verification
      const verificationsWithProfiles = await Promise.all(
        (data || []).map(async (v) => {
          const { data: profile } = await supabase
            .from("artist_profiles")
            .select("artist_name, avatar_url, genre")
            .eq("user_id", v.user_id)
            .maybeSingle();
          return { ...v, artist_profile: profile };
        })
      );

      setVerifications(verificationsWithProfiles);
    } catch (error) {
      console.error("Error fetching verifications:", error);
      toast.error("Failed to load verifications");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (verification: Verification) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("artist_verifications")
        .update({
          verification_status: "verified",
          verified_at: new Date().toISOString(),
          verified_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", verification.id);

      if (error) throw error;

      // Create notification for artist
      await supabase.from("notifications").insert({
        user_id: verification.user_id,
        type: "verification_approved",
        title: "🎉 You're Verified!",
        message: "Congratulations! Your artist verification has been approved.",
        link: "/studio/verification",
      });

      toast.success("Verification approved!");
      fetchVerifications();
      setSelectedVerification(null);
    } catch (error) {
      console.error("Error approving verification:", error);
      toast.error("Failed to approve verification");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedVerification) return;
    
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("artist_verifications")
        .update({
          verification_status: "rejected",
          rejection_reason: rejectionReason || "Your verification documents could not be verified.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedVerification.id);

      if (error) throw error;

      // Create notification for artist
      await supabase.from("notifications").insert({
        user_id: selectedVerification.user_id,
        type: "verification_rejected",
        title: "Verification Update",
        message: "Your verification request needs additional information. Please check your verification page.",
        link: "/studio/verification",
      });

      toast.success("Verification rejected");
      fetchVerifications();
      setSelectedVerification(null);
      setRejectionReason("");
    } catch (error) {
      console.error("Error rejecting verification:", error);
      toast.error("Failed to reject verification");
    } finally {
      setProcessing(false);
    }
  };

  const filteredVerifications = verifications.filter((v) => {
    const matchesSearch = 
      v.artist_profile?.artist_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.user_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = 
      selectedTab === "all" || 
      v.verification_status === selectedTab;
    return matchesSearch && matchesTab;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/30 gap-1"><CheckCircle2 className="h-3 w-3" />Verified</Badge>;
      case "submitted":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30 gap-1"><Clock className="h-3 w-3" />Pending Review</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/30 gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const counts = {
    all: verifications.length,
    submitted: verifications.filter(v => v.verification_status === "submitted").length,
    verified: verifications.filter(v => v.verification_status === "verified").length,
    rejected: verifications.filter(v => v.verification_status === "rejected").length,
  };

  return (
    <AdminLayout title="Artist Verifications" description="Review and manage artist verification requests">
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by artist name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="submitted" className="gap-1">
            Pending Review <Badge variant="secondary" className="ml-1">{counts.submitted}</Badge>
          </TabsTrigger>
          <TabsTrigger value="verified" className="gap-1">
            Verified <Badge variant="secondary" className="ml-1">{counts.verified}</Badge>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-1">
            Rejected <Badge variant="secondary" className="ml-1">{counts.rejected}</Badge>
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-1">
            All <Badge variant="secondary" className="ml-1">{counts.all}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredVerifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No verifications found in this category.
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredVerifications.map((verification) => (
                <Card key={verification.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {verification.artist_profile?.avatar_url ? (
                          <img
                            src={verification.artist_profile.avatar_url}
                            alt={verification.artist_profile.artist_name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold">
                            {verification.artist_profile?.artist_name || "Unknown Artist"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {verification.artist_profile?.genre || "No genre"}
                          </p>
                          {verification.submitted_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Submitted: {format(new Date(verification.submitted_at), "MMM d, yyyy")}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {getStatusBadge(verification.verification_status)}
                        
                        {verification.verification_status === "submitted" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(verification)}
                              disabled={processing}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedVerification(verification)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}

                        {verification.documents_url && verification.documents_url.length > 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            asChild
                          >
                            <a href={verification.documents_url[0]} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>

                    {verification.rejection_reason && (
                      <div className="mt-3 p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                        <p className="text-sm text-red-500">
                          <strong>Rejection Reason:</strong> {verification.rejection_reason}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Rejection Dialog */}
      <Dialog open={!!selectedVerification} onOpenChange={() => setSelectedVerification(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Verification</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this verification request. The artist will be notified.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedVerification(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing}>
              {processing ? "Processing..." : "Reject Verification"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
