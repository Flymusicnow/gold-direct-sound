import { Link, useLocation } from "react-router-dom";
import { FlyMusicLogo } from "@/components/FlyMusicLogo";
import { useAppMode } from "@/hooks/useAppMode";
import { Badge } from "@/components/ui/badge";

export const Footer = () => {
  const { mode } = useAppMode();
  const location = useLocation();
  const isPrivateBeta = mode === 'PRIVATE_BETA';
  const isLandingPage = location.pathname === '/';

  return (
    <footer className="border-t border-border bg-background/95 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FlyMusicLogo size="sm" />
              {isPrivateBeta && (
                <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                  Private Beta
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              The new era of music. Direct artist-to-fan connection.
            </p>
          </div>

          {/* Platform - Hidden on landing page */}
          {!isLandingPage && (
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/explore" className="text-muted-foreground hover:text-primary transition-colors">
                    Explore Artists
                  </Link>
                </li>
                <li>
                  <Link to="/search" className="text-muted-foreground hover:text-primary transition-colors">
                    Search
                  </Link>
                </li>
                {/* Hide these links in PRIVATE_BETA mode */}
                {!isPrivateBeta && (
                  <>
                    <li>
                      <Link to="/how-it-works" className="text-muted-foreground hover:text-primary transition-colors">
                        How It Works
                      </Link>
                    </li>
                    <li>
                      <Link to="/top-artists" className="text-muted-foreground hover:text-primary transition-colors">
                        Top Artists
                      </Link>
                    </li>
                    <li>
                      <Link to="/pricing" className="text-muted-foreground hover:text-primary transition-colors">
                        Pricing
                      </Link>
                    </li>
                    <li>
                      <Link to="/changelog" className="text-muted-foreground hover:text-primary transition-colors">
                        Changelog
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>
          )}

          {/* Trust - Always visible */}
          <div>
            <h4 className="font-semibold mb-4">Trust</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/trust" className="text-muted-foreground hover:text-primary transition-colors">
                  Trust Center
                </Link>
              </li>
              <li>
                <Link to="/principles" className="text-muted-foreground hover:text-primary transition-colors">
                  Principles
                </Link>
              </li>
              <li>
                <Link to="/safety" className="text-muted-foreground hover:text-primary transition-colors">
                  Safety
                </Link>
              </li>
            </ul>
          </div>

          {/* Partners - Hidden on landing page */}
          {!isLandingPage && (
            <div>
              <h4 className="font-semibold mb-4">Partners</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/brands" className="text-muted-foreground hover:text-primary transition-colors">
                    Brand Portal
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* Legal - Always visible */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/legal/user-agreement" className="text-muted-foreground hover:text-primary transition-colors">
                  User Agreement
                </Link>
              </li>
              <li>
                <Link to="/legal/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/legal/fan-terms" className="text-muted-foreground hover:text-primary transition-colors">
                  Fan Terms
                </Link>
              </li>
              <li>
                <Link to="/legal/artist-agreement" className="text-muted-foreground hover:text-primary transition-colors">
                  Artist Agreement
                </Link>
              </li>
              <li>
                <Link to="/legal/risk-disclaimer" className="text-muted-foreground hover:text-primary transition-colors">
                  Risk Disclaimer
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} FlyMusic. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
