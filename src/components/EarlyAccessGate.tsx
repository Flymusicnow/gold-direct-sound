import { ReactNode } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBetaAccess } from "@/hooks/useBetaAccess";
import { useFanInviteAccess } from "@/hooks/useFanInviteAccess";
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
  '/fan',
];

// Fan invite-only routes
const FAN_INVITE_ROUTES = ['/join/fan', '/signin/fan'];

export function EarlyAccessGate({ children }: EarlyAccessGateProps) {
  // ALL hooks must be called at the top, before any early returns
  const { user, loading: authLoading } = useAuth();
  const { hasBetaAccess, loading: betaLoading, refetch } = useBetaAccess();
  const { hasInviteAccess, loading: inviteLoading } = useFanInviteAccess();
  const location = useLocation();

  // Check if current route is public
  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    location.pathname === route || location.pathname.startsWith('/auth')
  );

  // Check if current route is a fan invite-only route
  const isFanInviteRoute = FAN_INVITE_ROUTES.some(route => 
    location.pathname === route
  );

  // Allow public routes without gate
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Handle fan invite-only routes (/join/fan, /signin/fan)
  if (isFanInviteRoute) {
    // Show loading while checking invite access
    if (inviteLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Checking access...</p>
          </div>
        </div>
      );
    }

    // If no invite access, redirect to /fan with reason param
    if (!hasInviteAccess) {
      return <Navigate to="/fan?reason=invite-required" replace />;
    }

    // Has invite access - allow through
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
