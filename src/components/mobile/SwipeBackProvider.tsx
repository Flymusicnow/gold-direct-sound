import { ReactNode, useState } from "react";
import { useLocation } from "react-router-dom";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import { SwipeBackIndicator } from "./SwipeBackIndicator";

interface SwipeBackProviderProps {
  children: ReactNode;
}

export function SwipeBackProvider({ children }: SwipeBackProviderProps) {
  const location = useLocation();
  const [swipeProgress, setSwipeProgress] = useState(0);

  // Disable swipe-back on home page and root routes
  const isRootPage = location.pathname === "/" || location.pathname === "/home";
  
  // Disable swipe-back when sheets/dialogs are open (check for dialog overlay)
  const hasOpenDialog = typeof document !== "undefined" && 
    document.querySelector('[role="dialog"], [data-radix-dialog-overlay]') !== null;

  const { isSwipeActive } = useSwipeBack({
    threshold: 100,
    edgeWidth: 30,
    enabled: !isRootPage && !hasOpenDialog,
    onSwipeProgress: setSwipeProgress,
  });

  return (
    <>
      {children}
      <SwipeBackIndicator 
        progress={swipeProgress} 
        isVisible={isSwipeActive || swipeProgress > 0} 
      />
    </>
  );
}
