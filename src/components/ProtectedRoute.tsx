import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { WrongRoleMessage } from "@/components/WrongRoleMessage";

interface ProtectedRouteProps {
  allowedRoles: ('fan' | 'artist' | 'admin' | 'brand' | 'super_admin')[];
  children: React.ReactNode;
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, loading, hasRole } = useAuth();
  const navigate = useNavigate();

  // Admins can access all protected routes
  const isAdmin = hasRole('admin') || hasRole('super_admin');

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to appropriate sign-in based on required role
      const primaryRole = allowedRoles[0];
      if (primaryRole === 'artist') {
        navigate('/signin/artist');
      } else if (primaryRole === 'fan') {
        navigate('/signin/fan');
      } else if (primaryRole === 'brand') {
        navigate('/signin/brand');
      } else {
        navigate('/');
      }
    }
  }, [user, loading, allowedRoles, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Check if user has allowed role
  const hasAllowedRole = isAdmin || allowedRoles.some(role => hasRole(role));
  
  if (!hasAllowedRole) {
    // Show clear message instead of silent redirect
    const requiredRole = allowedRoles[0] as 'artist' | 'fan' | 'brand' | 'admin';
    return <WrongRoleMessage requiredRole={requiredRole} />;
  }

  return <>{children}</>;
}
