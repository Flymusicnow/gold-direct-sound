import { useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  fanNavConfig,
  artistNavConfig,
  adminNavConfig,
  getBreadcrumbsForPath,
  NavConfig,
} from "@/config/navigation";

interface PageBreadcrumbProps {
  role?: "fan" | "artist" | "admin";
  customItems?: { label: string; path?: string }[];
}

export function PageBreadcrumb({ role, customItems }: PageBreadcrumbProps) {
  const location = useLocation();
  const { t } = useLanguage();

  // Auto-detect role from path if not provided
  const detectedRole = role || (
    location.pathname.startsWith("/admin")
      ? "admin"
      : location.pathname.startsWith("/studio")
        ? "artist"
        : "fan"
  );

  const config: NavConfig =
    detectedRole === "admin"
      ? adminNavConfig
      : detectedRole === "artist"
        ? artistNavConfig
        : fanNavConfig;

  const breadcrumbs = customItems || getBreadcrumbsForPath(config, location.pathname);

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <li>
          <Link
            to="/"
            className="flex items-center hover:text-foreground transition-colors"
            aria-label="Home"
          >
            <Home className="h-4 w-4" />
          </Link>
        </li>
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const crumbWithKey = crumb as { label: string; path?: string; i18nKey?: string };
          const label = crumbWithKey.i18nKey ? t(crumbWithKey.i18nKey) : crumb.label;

          return (
            <li key={crumb.path || crumb.label} className="flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
              {isLast || !crumb.path ? (
                <span className="text-foreground font-medium">{label}</span>
              ) : (
                <Link
                  to={crumb.path}
                  className="hover:text-foreground transition-colors"
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
