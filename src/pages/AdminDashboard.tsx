import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MobileAdminNav } from "@/components/admin/MobileAdminNav";
import { BottomNavBarAdmin } from "@/components/mobile/BottomNavBarAdmin";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Check, X, Settings } from "lucide-react";

interface PendingArtist {
  id: string;
  user_id: string;
  artist_name: string;
  bio: string | null;
  genre: string | null;
  city: string | null;
  country: string | null;
  status: string;
}

export default function AdminDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [pendingArtists, setPendingArtists] = useState<PendingArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (profile?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchPendingArtists();
  }, [user, profile, navigate]);

  const fetchPendingArtists = async () => {
    const { data, error } = await supabase
      .from('artist_profiles')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending artists:', error);
    } else {
      setPendingArtists(data || []);
    }
    setLoading(false);
  };

  const handleApprove = async (artistId: string) => {
    const { error } = await supabase
      .from('artist_profiles')
      .update({ status: 'approved' })
      .eq('id', artistId);

    if (error) {
      toast.error("Error approving artist");
      console.error(error);
    } else {
      toast.success("Artist approved!");
      fetchPendingArtists();
    }
  };

  const handleReject = async (artistId: string) => {
    const { error } = await supabase
      .from('artist_profiles')
      .update({ status: 'rejected' })
      .eq('id', artistId);

    if (error) {
      toast.error("Error rejecting artist");
      console.error(error);
    } else {
      toast.success("Artist rejected");
      fetchPendingArtists();
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
    <>
      <MobileAdminNav />
      <div className="min-h-screen py-24 px-4 pb-20 md:pb-4">
        <div className="container mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => navigate('/admin/spotlight')} variant="outline">
              Manage Spotlight
            </Button>
            <Button onClick={() => navigate('/admin/beta-codes')} variant="outline">
              Manage Beta Codes
            </Button>
            <Button onClick={() => navigate('/admin/features')} variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Feature Flags
            </Button>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Pending Artist Approvals</h2>
          
          {pendingArtists.length === 0 ? (
            <p className="text-muted-foreground">No pending approvals.</p>
          ) : (
            <div className="space-y-4">
              {pendingArtists.map((artist) => (
                <Card key={artist.id} className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{artist.artist_name}</h3>
                      {artist.bio && (
                        <p className="text-sm text-muted-foreground mb-2">{artist.bio}</p>
                      )}
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        {artist.genre && <span>Genre: {artist.genre}</span>}
                        {artist.city && <span>Location: {artist.city}, {artist.country}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        className="bg-primary"
                        onClick={() => handleApprove(artist.id)}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleReject(artist.id)}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
      {isMobile && <BottomNavBarAdmin />}
    </>
  );
}
