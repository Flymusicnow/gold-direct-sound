import React, { createContext, useContext, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  NavConfig,
  fanNavConfig,
  artistNavConfig,
  adminNavConfig,
  getFlatNavItems,
  getBreadcrumbsForPath,
  NavItem,
} from "@/config/navigation";

interface NavConfigContextType {
  config: NavConfig;
  flatItems: NavItem[];
  role: "fan" | "artist" | "admin";
  getBreadcrumbs: (path: string) => { label: string; path: string; i18nKey?: string }[];
}

const NavConfigContext = createContext<NavConfigContextType | null>(null);

export function NavConfigProvider({ children }: { children: React.ReactNode }) {
  const { hasRole } = useAuth();

  const role = useMemo((): "fan" | "artist" | "admin" => {
    if (hasRole("admin")) return "admin";
    if (hasRole("artist")) return "artist";
    return "fan";
  }, [hasRole]);

  const config = useMemo((): NavConfig => {
    switch (role) {
      case "admin":
        return adminNavConfig;
      case "artist":
        return artistNavConfig;
      default:
        return fanNavConfig;
    }
  }, [role]);

  const flatItems = useMemo(() => getFlatNavItems(config), [config]);

  const getBreadcrumbs = (path: string) => getBreadcrumbsForPath(config, path);

  return (
    <NavConfigContext.Provider value={{ config, flatItems, role, getBreadcrumbs }}>
      {children}
    </NavConfigContext.Provider>
  );
}

export function useNavConfig() {
  const context = useContext(NavConfigContext);
  if (!context) {
    throw new Error("useNavConfig must be used within a NavConfigProvider");
  }
  return context;
}

// Role-specific hooks for convenience
export function useFanNav() {
  return {
    config: fanNavConfig,
    flatItems: getFlatNavItems(fanNavConfig),
    getBreadcrumbs: (path: string) => getBreadcrumbsForPath(fanNavConfig, path),
  };
}

export function useArtistNav() {
  return {
    config: artistNavConfig,
    flatItems: getFlatNavItems(artistNavConfig),
    getBreadcrumbs: (path: string) => getBreadcrumbsForPath(artistNavConfig, path),
  };
}

export function useAdminNav() {
  return {
    config: adminNavConfig,
    flatItems: getFlatNavItems(adminNavConfig),
    getBreadcrumbs: (path: string) => getBreadcrumbsForPath(adminNavConfig, path),
  };
}
