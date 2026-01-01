import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Routes that should preserve scroll position
const PRESERVE_SCROLL_ROUTES = [
  '/studio/profile',
  '/studio/videos',
  '/studio/tracks',
  '/studio/settings',
  '/studio/spotlight',
  '/studio/promo',
  '/studio/opportunities',
  '/studio/presskit',
  '/studio/subscription',
  '/studio/analytics',
  '/studio/comments',
  '/studio/testimonials',
  '/studio/merch',
  '/studio/live',
  '/studio/events',
  '/studio/collaborations',
  '/studio/earnings',
];

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Don't scroll to top for routes that should preserve position
    if (PRESERVE_SCROLL_ROUTES.some(route => pathname.startsWith(route))) {
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}
