import { Link } from "react-router-dom";
import { FlyMusicLogo } from "@/components/FlyMusicLogo";

const footerLinks = [
  { label: "Trust Center", path: "/trust" },
  { label: "Safety", path: "/trust/safety" },
  { label: "Privacy Policy", path: "/legal/privacy-policy" },
  { label: "Brand Terms", path: "/legal/brand-portal-terms" },
];

export function BrandFooter() {
  return (
    <footer className="border-t border-border bg-background/50 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo + Copyright */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FlyMusicLogo size="sm" />
            <span>© {new Date().getFullYear()} FlyMusic</span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            {footerLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
