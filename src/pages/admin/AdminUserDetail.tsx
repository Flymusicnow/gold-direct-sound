import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAdminActivityLog } from "@/hooks/useAdminActivityLog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Download,
  UserX,
  UserCheck,
  Trash2,
  Music,
  Video,
  MessageSquare,
  Heart,
} from "lucide-react";

interface UserDetail {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  is_suspended: boolean;
  created_at: string;
  roles: string[];
}

interface UserStats {
  tracks: number;
  videos: number;
  comments: number;
  likes: number;
  follows: number;
}

export default function AdminUserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { logActivity } = useAdminActivityLog();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [stats, setStats] = useState<UserStats>({ tracks: 0, videos: 0, comments: 0, likes: 0, follows: 0 });
  const [loading, setLoading] = useState(true);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserDetail();
      fetchUserStats();
    }
  }, [userId]);

  const fetchUserDetail = async () => {
    if (!userId) return;

    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      setUser({
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        avatar_url: profile.avatar_url,
        is_suspended: (profile as any).is_suspended || false,
        created_at: profile.created_at,
        roles: roles?.map((r) => r.role) || [],
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      toast.error("Failed to load user details");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    if (!userId) return;

    try {
      // Get artist profile if exists
      const { data: artistProfile } = await supabase
        .from("artist_profiles")
        .select("id")
        .eq("user_id", userId)
        .single();

      let trackCount = 0;
      let videoCount = 0;

      if (artistProfile) {
        const [tracksRes, videosRes] = await Promise.all([
          supabase.from("tracks").select("id", { count: "exact", head: true }).eq("artist_id", artistProfile.id),
          supabase.from("artist_video_posts").select("id", { count: "exact", head: true }).eq("artist_id", artistProfile.id),
        ]);
        trackCount = tracksRes.count || 0;
        videoCount = videosRes.count || 0;
      }

      const [commentsRes, likesRes, followsRes] = await Promise.all([
        supabase.from("comments").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("likes").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("fan_id", userId),
      ]);

      setStats({
        tracks: trackCount,
        videos: videoCount,
        comments: commentsRes.count || 0,
        likes: likesRes.count || 0,
        follows: followsRes.count || 0,
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  const handleToggleSuspend = async () => {
    if (!user) return;

    try {
      const newStatus = !user.is_suspended;
      const { error } = await (supabase.from("profiles") as any)
        .update({ is_suspended: newStatus })
        .eq("id", user.id);

      if (error) throw error;

      await logActivity(
        newStatus ? "user_suspend" : "user_unsuspend",
        "user",
        user.id,
        { user_name: user.full_name, action: newStatus ? "suspended" : "unsuspended" }
      );

      toast.success(newStatus ? "User suspended" : "User unsuspended");
      setUser({ ...user, is_suspended: newStatus });
      setSuspendDialogOpen(false);
    } catch (error) {
      console.error("Error toggling suspension:", error);
      toast.error("Failed to update user status");
    }
  };

  const handleExportData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc("admin_export_user_data", {
        target_user_id: user.id,
      });

      if (error) throw error;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `user_data_${user.id}.json`;
      a.click();
      URL.revokeObjectURL(url);

      await logActivity("user_data_export", "user", user.id, { user_name: user.full_name });
      toast.success("User data exported");
    } catch (error) {
      console.error("Error exporting user data:", error);
      toast.error("Failed to export user data");
    }
  };

  const handleDeleteUser = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc("admin_delete_user_data", {
        target_user_id: user.id,
      });

      if (error) throw error;

      await logActivity("user_data_delete", "user", user.id, { user_name: user.full_name });
      toast.success("User data deleted (GDPR request fulfilled)");
      navigate("/admin/users");
    } catch (error) {
      console.error("Error deleting user data:", error);
      toast.error("Failed to delete user data");
    }
  };

  if (loading) {
    return (
      <AdminLayout title="User Details" description="Loading...">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading user details...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout title="User Not Found" description="The requested user could not be found">
        <Button variant="outline" onClick={() => navigate("/admin/users")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="User Details" description={`Viewing ${user.full_name || "Unknown User"}`}>
      <div className="space-y-6">
        {/* User Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <CardTitle className="text-xl">{user.full_name || "No Name"}</CardTitle>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{user.email || "No email"}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {user.is_suspended ? (
                  <Badge variant="destructive">Suspended</Badge>
                ) : (
                  <Badge variant="outline">Active</Badge>
                )}
                <div className="flex gap-1 flex-wrap">
                  {user.roles.map((role) => (
                    <Badge key={role} variant="secondary" className="text-xs">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.tracks}</p>
                  <p className="text-xs text-muted-foreground">Tracks</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.videos}</p>
                  <p className="text-xs text-muted-foreground">Videos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.comments}</p>
                  <p className="text-xs text-muted-foreground">Comments</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.likes}</p>
                  <p className="text-xs text-muted-foreground">Likes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.follows}</p>
                  <p className="text-xs text-muted-foreground">Following</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Admin Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button variant="outline" onClick={handleExportData}>
              <Download className="h-4 w-4 mr-2" />
              Export User Data (GDPR)
            </Button>
            <Button
              variant={user.is_suspended ? "default" : "destructive"}
              onClick={() => setSuspendDialogOpen(true)}
            >
              {user.is_suspended ? (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Unsuspend User
                </>
              ) : (
                <>
                  <UserX className="h-4 w-4 mr-2" />
                  Suspend User
                </>
              )}
            </Button>
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete User Data (GDPR)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Suspend Confirmation Dialog */}
      <AlertDialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {user.is_suspended ? "Unsuspend User?" : "Suspend User?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {user.is_suspended
                ? `This will restore access for ${user.full_name || "this user"}. They will be able to use the platform again.`
                : `This will prevent ${user.full_name || "this user"} from accessing the platform. They will not be able to log in or use any features.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleSuspend}>
              {user.is_suspended ? "Unsuspend" : "Suspend"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all data for {user.full_name || "this user"} (GDPR right to be forgotten).
              This action cannot be undone. Consider exporting data first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="outline" onClick={handleExportData}>
              Export First
            </Button>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90">
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
