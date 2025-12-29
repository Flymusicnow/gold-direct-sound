import { ReactNode } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRoleBetaAccess } from "@/hooks/useRoleBetaAccess";
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

// Fan invite-only routes (sign-in is NOT included - existing members can sign in freely)
const FAN_INVITE_ROUTES = ['/join/fan'];

export function EarlyAccessGate({ children }: EarlyAccessGateProps) {
  // ALL hooks must be called at the top, before any early returns
  const { user, loading: authLoading, hasRole } = useAuth();
  const { hasAccess: hasFanBetaAccess, loading: fanBetaLoading, refetch: refetchFan } = useRoleBetaAccess('fan');
  const { hasAccess: hasArtistBetaAccess, loading: artistBetaLoading, refetch: refetchArtist } = useRoleBetaAccess('artist');
  const { hasInviteAccess, loading: inviteLoading } = useFanInviteAccess();
  const location = useLocation();

  // Determine route type
  const isFanRoute = location.pathname.startsWith('/fan/');
  const isStudioRoute = location.pathname.startsWith('/studio');

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
  const betaLoading = fanBetaLoading || artistBetaLoading;
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

  // Route-specific beta access checks
  if (isFanRoute) {
    // Fan routes require fan_beta_access
    if (hasFanBetaAccess !== true) {
      return <EarlyAccessWall onCodeRedeemed={refetchFan} />;
    }
  } else if (isStudioRoute) {
    // Studio routes require artist_beta_access
    if (hasArtistBetaAccess !== true) {
      return <EarlyAccessWall onCodeRedeemed={refetchArtist} />;
    }
  } else {
    // For other protected routes (like /brand), check if user has ANY beta access
    // based on their roles
    const isFan = hasRole('fan');
    const isArtist = hasRole('artist');
    
    const hasRequiredAccess = 
      (isFan && hasFanBetaAccess) || 
      (isArtist && hasArtistBetaAccess) ||
      (!isFan && !isArtist); // Users without fan/artist role (e.g. brand, admin) pass through
    
    if (!hasRequiredAccess) {
      return <EarlyAccessWall onCodeRedeemed={() => {
        refetchFan();
        refetchArtist();
      }} />;
    }
  }

  // User has required beta access, render the app
  return <>{children}</>;
}
