import { ReactNode } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBetaAccess } from "@/hooks/useBetaAccess";
import { EarlyAccessWall } from "./EarlyAccessWall";

interface EarlyAccessGateProps {
  children: ReactNode;
}

// Routes that don't require beta access
const PUBLIC_ROUTES = [
  '/auth',
  '/learn',
];

export function EarlyAccessGate({ children }: EarlyAccessGateProps) {
  const { user, loading: authLoading } = useAuth();
  const { hasBetaAccess, loading: betaLoading, refetch } = useBetaAccess();
  const location = useLocation();

  // Check if current route is public
  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    location.pathname === route || location.pathname.startsWith('/auth')
  );

  // Allow public routes without gate
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Show loading while checking auth
  if (authLoading || betaLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading FlyMusic...</p>
        </div>
      </div>
    );
  }

  // If no user, redirect to auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If user doesn't have beta access, show the wall
  if (!hasBetaAccess) {
    return <EarlyAccessWall onCodeRedeemed={refetch} />;
  }

  // User has beta access, render the app
  return <>{children}</>;
}
