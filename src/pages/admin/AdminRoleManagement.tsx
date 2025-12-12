import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Shield, ShieldCheck, UserPlus, UserMinus, Search, AlertTriangle } from "lucide-react";
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

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  roles: string[];
}

export default function AdminRoleManagement() {
  const { user, hasRole } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState<{ id: string; email: string; full_name: string | null } | null>(null);
  const [searching, setSearching] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<AdminUser | null>(null);

  const isSuperAdmin = hasRole("super_admin");

  useEffect(() => {
    if (isSuperAdmin) {
      fetchAdmins();
    }
  }, [isSuperAdmin]);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      // Get all users with admin or super_admin roles
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["admin", "super_admin"]);

      if (roleError) throw roleError;

      const userIds = [...new Set(roleData?.map(r => r.user_id) || [])];
      
      if (userIds.length === 0) {
        setAdmins([]);
        return;
      }

      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", userIds);

      if (profileError) throw profileError;

      const adminUsers: AdminUser[] = (profiles || []).map(profile => ({
        ...profile,
        roles: roleData?.filter(r => r.user_id === profile.id).map(r => r.role) || [],
      }));

      setAdmins(adminUsers);
    } catch (error) {
      console.error("Error fetching admins:", error);
      toast.error("Failed to load admins");
    } finally {
      setLoading(false);
    }
  };

  const searchUser = async () => {
    if (!searchEmail.trim()) return;
    setSearching(true);
    setSearchResult(null);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .ilike("email", `%${searchEmail}%`)
        .limit(1)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          toast.error("No user found with that email");
        } else {
          throw error;
        }
        return;
      }

      setSearchResult(data);
    } catch (error) {
      console.error("Error searching user:", error);
      toast.error("Failed to search user");
    } finally {
      setSearching(false);
    }
  };

  const grantAdminRole = async () => {
    if (!searchResult || !user) return;

    try {
      // Check if already admin
      const existingAdmin = admins.find(a => a.id === searchResult.id);
      if (existingAdmin?.roles.includes("admin")) {
        toast.error("User is already an admin");
        return;
      }

      const { error } = await supabase
        .from("user_roles")
        .upsert({ user_id: searchResult.id, role: "admin" }, { onConflict: "user_id,role", ignoreDuplicates: true });

      if (error) throw error;

      // Log activity
      await (supabase.from("admin_activity_logs") as any).insert({
        admin_id: user.id,
        action: "role_grant",
        target_type: "user",
        target_id: searchResult.id,
        details: { role: "admin", email: searchResult.email },
      });

      toast.success(`Admin role granted to ${searchResult.email}`);
      setSearchResult(null);
      setSearchEmail("");
      fetchAdmins();
    } catch (error) {
      console.error("Error granting role:", error);
      toast.error("Failed to grant admin role");
    }
  };

  const revokeAdminRole = async () => {
    if (!revokeTarget || !user) return;

    // Prevent revoking own super_admin
    if (revokeTarget.id === user.id && revokeTarget.roles.includes("super_admin")) {
      toast.error("Cannot revoke your own super_admin role");
      setRevokeTarget(null);
      return;
    }

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", revokeTarget.id)
        .eq("role", "admin");

      if (error) throw error;

      // Log activity
      await (supabase.from("admin_activity_logs") as any).insert({
        admin_id: user.id,
        action: "role_revoke",
        target_type: "user",
        target_id: revokeTarget.id,
        details: { role: "admin", email: revokeTarget.email },
      });

      toast.success(`Admin role revoked from ${revokeTarget.email}`);
      setRevokeTarget(null);
      fetchAdmins();
    } catch (error) {
      console.error("Error revoking role:", error);
      toast.error("Failed to revoke admin role");
    }
  };

  if (!isSuperAdmin) {
    return (
      <AdminLayout title="Role Management" description="Super-admin access required">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
            <p className="text-muted-foreground">Only super-admins can manage admin roles.</p>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Role Management" description="Grant or revoke admin access (Super-Admin only)">
      <div className="space-y-6">
        {/* Grant Admin Access */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Grant Admin Access
            </CardTitle>
            <CardDescription>Search for a user by email to grant them admin access</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchUser()}
                  className="pl-10"
                />
              </div>
              <Button onClick={searchUser} disabled={searching}>
                {searching ? "Searching..." : "Search"}
              </Button>
            </div>

            {searchResult && (
              <div className="mt-4 p-4 border rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-medium">{searchResult.full_name || "No name"}</p>
                  <p className="text-sm text-muted-foreground">{searchResult.email}</p>
                </div>
                <Button onClick={grantAdminRole} className="bg-green-600 hover:bg-green-700">
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Grant Admin
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Admins */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Current Admins ({admins.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading admins...</p>
            ) : admins.length === 0 ? (
              <p className="text-muted-foreground">No admins found</p>
            ) : (
              <div className="space-y-3">
                {admins.map((admin) => (
                  <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        {admin.roles.includes("super_admin") ? (
                          <ShieldCheck className="h-5 w-5 text-primary" />
                        ) : (
                          <Shield className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{admin.full_name || "No name"}</p>
                        <p className="text-sm text-muted-foreground">{admin.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {admin.roles.map((role) => (
                        <Badge key={role} variant={role === "super_admin" ? "default" : "secondary"}>
                          {role}
                        </Badge>
                      ))}
                      {admin.roles.includes("admin") && !admin.roles.includes("super_admin") && admin.id !== user?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRevokeTarget(admin)}
                          className="text-destructive hover:text-destructive"
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revoke Confirmation */}
      <AlertDialog open={!!revokeTarget} onOpenChange={() => setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Admin Access?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke admin access from {revokeTarget?.email}? They will no longer be able to access the admin panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={revokeAdminRole} className="bg-destructive text-destructive-foreground">
              Revoke Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
