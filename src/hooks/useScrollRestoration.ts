import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const scrollPositions = new Map<string, number>();

export function useScrollRestoration(scrollRef: React.RefObject<HTMLElement>) {
  const location = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    // Restore scroll position on mount
    if (isFirstRender.current) {
      const savedPosition = scrollPositions.get(location.pathname);
      if (savedPosition !== undefined) {
        element.scrollTop = savedPosition;
      }
      isFirstRender.current = false;
    }

    // Save scroll position on scroll
    const handleScroll = () => {
      scrollPositions.set(location.pathname, element.scrollTop);
    };

    element.addEventListener('scroll', handleScroll);
    return () => element.removeEventListener('scroll', handleScroll);
  }, [location.pathname, scrollRef]);

  // Reset first render flag when route changes
  useEffect(() => {
    isFirstRender.current = true;
  }, [location.pathname]);
}
