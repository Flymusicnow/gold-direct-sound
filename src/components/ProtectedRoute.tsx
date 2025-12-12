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

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth');
        return;
      }

      const hasAllowedRole = allowedRoles.some(role => hasRole(role));
      if (!hasAllowedRole) {
        navigate('/');
      }
    }
  }, [user, loading, allowedRoles, hasRole, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user || !allowedRoles.some(role => hasRole(role))) {
    return null;
  }

  return <>{children}</>;
}
