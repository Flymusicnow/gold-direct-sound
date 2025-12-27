import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBetaAccess } from "@/hooks/useBetaAccess";
import { EarlyAccessWall } from "./EarlyAccessWall";
import { BetaLandingPage } from "./BetaLandingPage";

interface EarlyAccessGateProps {
  children: ReactNode;
}

// Routes that don't require beta access - browsing is free, participation is gated
const PUBLIC_ROUTES = [
  '/auth',
  '/learn',
  '/explore',
  '/search',
  '/pricing',
  '/how-it-works',
  '/top-artists',
  '/artist/',
  '/spotlight/',
  '/collections/',
  '/changelog',
  '/trust',
  '/brands',
];

export function EarlyAccessGate({ children }: EarlyAccessGateProps) {
  // ALL hooks must be called at the top, before any early returns
  const { user, loading: authLoading, hasRole } = useAuth();
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

  // If no user, show the beta landing page
  if (!user) {
    return <BetaLandingPage />;
  }

  // If user doesn't have beta access, show the wall (defensive check for null/false)
  if (hasBetaAccess !== true) {
    return <EarlyAccessWall onCodeRedeemed={refetch} />;
  }

  // User has beta access, render the app
  return <>{children}</>;
}
