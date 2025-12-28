import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppMode } from '@/hooks/useAppMode';
import { useFanInviteAccess } from '@/hooks/useFanInviteAccess';
import { useAuth } from '@/contexts/AuthContext';

interface PrivateBetaGateProps {
  children: ReactNode;
  /** The role this route is for - determines redirect behavior */
  routeRole?: 'fan' | 'artist';
}

/**
 * Protects routes that should only be accessible with an invite in PRIVATE_BETA mode.
 * In PUBLIC_AUTH mode, all routes are accessible.
 * 
 * Usage:
 * <PrivateBetaGate routeRole="fan">
 *   <JoinFan />
 * </PrivateBetaGate>
 */
export function PrivateBetaGate({ children, routeRole = 'fan' }: PrivateBetaGateProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, loading: modeLoading } = useAppMode();
  const { hasInviteAccess, loading: inviteLoading } = useFanInviteAccess();
  const { hasRole } = useAuth();

  // Admins always have access
  const isAdmin = hasRole('admin') || hasRole('super_admin');

  useEffect(() => {
    // Don't do anything while loading
    if (modeLoading || inviteLoading) return;

    // Admins bypass the gate
    if (isAdmin) return;

    // In PUBLIC_AUTH mode, no gating needed
    if (mode === 'PUBLIC_AUTH') return;

    // In PRIVATE_BETA, check invite access
    if (mode === 'PRIVATE_BETA' && !hasInviteAccess) {
      // Redirect to /fan with reason param
      const redirectPath = routeRole === 'artist' ? '/fan' : '/fan';
      navigate(`${redirectPath}?reason=invite-required`, { replace: true });
    }
  }, [mode, modeLoading, hasInviteAccess, inviteLoading, isAdmin, navigate, routeRole]);

  // Show loading state
  if (modeLoading || inviteLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Admins always pass
  if (isAdmin) {
    return <>{children}</>;
  }

  // In PUBLIC_AUTH mode, always pass
  if (mode === 'PUBLIC_AUTH') {
    return <>{children}</>;
  }

  // In PRIVATE_BETA, only pass if has invite access
  if (mode === 'PRIVATE_BETA' && hasInviteAccess) {
    return <>{children}</>;
  }

  // Default: block (redirect effect will handle navigation)
  return null;
}
