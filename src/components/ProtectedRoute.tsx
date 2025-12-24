import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  allowedRoles: ('fan' | 'artist' | 'admin' | 'brand' | 'super_admin')[];
  children: React.ReactNode;
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, loading, hasRole } = useAuth();
  const navigate = useNavigate();

  // Admins can access all protected routes (for testing reported issues, etc.)
  const isAdmin = hasRole('admin') || hasRole('super_admin');

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth');
        return;
      }

      const hasAllowedRole = isAdmin || allowedRoles.some(role => hasRole(role));
      if (!hasAllowedRole) {
        navigate('/');
      }
    }
  }, [user, loading, allowedRoles, hasRole, navigate, isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user || !(isAdmin || allowedRoles.some(role => hasRole(role)))) {
    return null;
  }

  return <>{children}</>;
}
