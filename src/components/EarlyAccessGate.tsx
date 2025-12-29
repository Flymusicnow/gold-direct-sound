import { ReactNode } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { useUserAccessState } from "@/hooks/useUserAccessState";
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
  '/signin',
  '/join',
];

// Fan invite-only routes (sign-in is NOT included - existing members can sign in freely)
const FAN_INVITE_ROUTES = ['/join/fan'];
const ARTIST_INVITE_ROUTES = ['/join/artist'];

export function EarlyAccessGate({ children }: EarlyAccessGateProps) {
  const location = useLocation();
  const {
    authenticated,
    role,
    hasFanAccess,
    hasArtistAccess,
    fanOnboarded,
    artistOnboarded,
    loading,
    refetch,
  } = useUserAccessState();

  // Determine route type
  const isFanRoute = location.pathname.startsWith('/fan/');
  const isStudioRoute = location.pathname.startsWith('/studio');

  // Check if current route is public
  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    location.pathname === route || 
    location.pathname.startsWith('/auth') ||
    location.pathname.startsWith('/signin') ||
    location.pathname.startsWith('/join') ||
    location.pathname.startsWith('/fan') && !location.pathname.startsWith('/fan/') ||
    location.pathname.startsWith('/artist') && !location.pathname.startsWith('/artist/')
  );

  // Check if current route is an invite-only route
  const isFanInviteRoute = FAN_INVITE_ROUTES.some(route => location.pathname === route);
  const isArtistInviteRoute = ARTIST_INVITE_ROUTES.some(route => location.pathname === route);

  // Allow public routes without gate
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Show loading while checking access state
  if (loading) {
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
  if (!authenticated) {
    return <BetaLandingPage />;
  }

  // Route-specific beta access checks with onboarding awareness
  if (isFanRoute) {
    // Fan routes require fan_beta_access
    if (!hasFanAccess) {
      return <EarlyAccessWall onCodeRedeemed={refetch} />;
    }
    // Has access but not onboarded - redirect to onboarding
    if (!fanOnboarded && !location.pathname.includes('/onboarding')) {
      return <Navigate to="/fan/onboarding" replace />;
    }
  } else if (isStudioRoute) {
    // Studio routes require artist_beta_access
    if (!hasArtistAccess) {
      return <EarlyAccessWall onCodeRedeemed={refetch} />;
    }
    // Has access but not onboarded - redirect to onboarding
    if (!artistOnboarded && !location.pathname.includes('/onboarding')) {
      return <Navigate to="/studio/onboarding" replace />;
    }
  } else {
    // For other protected routes (like /brand), check if user has ANY beta access
    // based on their roles
    const isFan = role === 'fan';
    const isArtist = role === 'artist';
    
    const hasRequiredAccess = 
      (isFan && hasFanAccess) || 
      (isArtist && hasArtistAccess) ||
      role === 'admin' ||
      role === 'brand'; // Brands and admins pass through
    
    if (!hasRequiredAccess) {
      return <EarlyAccessWall onCodeRedeemed={refetch} />;
    }
  }

  // User has required beta access, render the app
  return <>{children}</>;
}
