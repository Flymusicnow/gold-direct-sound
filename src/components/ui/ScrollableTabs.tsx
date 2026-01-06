import * as React from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface ScrollableTabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  sticky?: boolean;
}

export function ScrollableTabsList({
  children,
  className,
  sticky = true,
  ...props
}: ScrollableTabsListProps) {
  const isMobile = useIsMobile();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = React.useState(false);
  const [showRightFade, setShowRightFade] = React.useState(false);

  // Check scroll position to show/hide fade gradients
  const checkScrollPosition = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setShowLeftFade(scrollLeft > 10);
    setShowRightFade(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  // Auto-scroll active tab into view
  const scrollActiveTabIntoView = React.useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const activeTab = container.querySelector('[data-state="active"]');
    if (activeTab) {
      const containerRect = container.getBoundingClientRect();
      const tabRect = activeTab.getBoundingClientRect();

      // Check if tab is out of view
      if (tabRect.left < containerRect.left || tabRect.right > containerRect.right) {
        activeTab.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, []);

  React.useEffect(() => {
    checkScrollPosition();
    const el = scrollRef.current;
    el?.addEventListener("scroll", checkScrollPosition);
    window.addEventListener("resize", checkScrollPosition);
    return () => {
      el?.removeEventListener("scroll", checkScrollPosition);
      window.removeEventListener("resize", checkScrollPosition);
    };
  }, [checkScrollPosition]);

  // Observe active tab changes and scroll into view
  React.useEffect(() => {
    const observer = new MutationObserver(scrollActiveTabIntoView);
    if (scrollRef.current) {
      observer.observe(scrollRef.current, {
        subtree: true,
        attributes: true,
        attributeFilter: ["data-state"],
      });
    }
    return () => observer.disconnect();
  }, [scrollActiveTabIntoView]);

  return (
    <div
      className={cn(
        "relative",
        sticky && isMobile && "sticky top-16 z-30 bg-background/95 backdrop-blur-sm border-b border-border"
      )}
      {...props}
    >
      {/* Left fade gradient */}
      {showLeftFade && (
        <div className="tabs-fade-left" aria-hidden="true" />
      )}

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className={cn(
          "tabs-scrollable scrollbar-hide",
          "-mx-4 px-4 md:mx-0 md:px-0",
          "md:overflow-x-visible",
          className
        )}
      >
        {children}
      </div>

      {/* Right fade gradient */}
      {showRightFade && (
        <div className="tabs-fade-right" aria-hidden="true" />
      )}
    </div>
  );
}
