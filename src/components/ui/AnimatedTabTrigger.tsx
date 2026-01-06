import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedTabTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  layoutId?: string;
  icon?: React.ReactNode;
}

export const AnimatedTabTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  AnimatedTabTriggerProps
>(({ className, children, icon, layoutId = "activeTab", ...props }, ref) => {
  const [isActive, setIsActive] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  // Monitor data-state attribute for active state
  React.useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "data-state") {
          const state = triggerRef.current?.getAttribute("data-state");
          setIsActive(state === "active");
        }
      });
    });

    if (triggerRef.current) {
      setIsActive(triggerRef.current.getAttribute("data-state") === "active");
      observer.observe(triggerRef.current, { attributes: true });
    }

    return () => observer.disconnect();
  }, []);

  return (
    <TabsPrimitive.Trigger
      ref={(node) => {
        triggerRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      className={cn(
        "relative flex-shrink-0 inline-flex items-center justify-center gap-2",
        "whitespace-nowrap px-4 py-3 md:px-6 md:py-4",
        "text-sm md:text-base font-medium",
        "text-muted-foreground transition-colors duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
        "data-[state=active]:text-primary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>

      {/* Animated gold underline */}
      {isActive && (
        <motion.div
          layoutId={layoutId}
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
          initial={false}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 35,
          }}
        />
      )}
    </TabsPrimitive.Trigger>
  );
});

AnimatedTabTrigger.displayName = "AnimatedTabTrigger";
