import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

interface RouteHistoryContextType {
  lastRoutes: string[];
  getReproPath: () => string;
}

const RouteHistoryContext = createContext<RouteHistoryContextType | undefined>(undefined);

const MAX_ROUTES = 10;

export function RouteHistoryProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [lastRoutes, setLastRoutes] = useState<string[]>([]);

  useEffect(() => {
    setLastRoutes(prev => {
      const newRoutes = [location.pathname, ...prev.filter(r => r !== location.pathname)];
      return newRoutes.slice(0, MAX_ROUTES);
    });
  }, [location.pathname]);

  const getReproPath = useCallback(() => {
    if (lastRoutes.length <= 1) return '';
    const recentRoutes = lastRoutes.slice(0, 3).reverse();
    return recentRoutes.join(' → ');
  }, [lastRoutes]);

  return (
    <RouteHistoryContext.Provider value={{ lastRoutes, getReproPath }}>
      {children}
    </RouteHistoryContext.Provider>
  );
}

export function useRouteHistory() {
  const context = useContext(RouteHistoryContext);
  if (!context) {
    // Return fallback if used outside provider
    return { lastRoutes: [], getReproPath: () => '' };
  }
  return context;
}
