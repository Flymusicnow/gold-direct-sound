import { Link } from "react-router-dom";
import { FlyMusicLogo } from "@/components/FlyMusicLogo";

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-background/95 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <FlyMusicLogo size="sm" />
            <p className="text-sm text-muted-foreground">
              The new era of music. Direct artist-to-fan connection.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/explore" className="text-muted-foreground hover:text-primary transition-colors">
                  Explore Artists
                </Link>
              </li>
              <li>
                <Link to="/discover" className="text-muted-foreground hover:text-primary transition-colors">
                  Discover
                </Link>
              </li>
              <li>
                <Link to="/learn" className="text-muted-foreground hover:text-primary transition-colors">
                  Learn
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust */}
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

          {/* Legal */}
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
          <p>© {new Date().getFullYear()} FlyMusic Gold. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};