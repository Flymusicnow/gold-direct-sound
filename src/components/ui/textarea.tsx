import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, onFocus, ...props }, ref) => {
  const internalRef = React.useRef<HTMLTextAreaElement>(null);
  const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    // Scroll input into view when focused on mobile (iOS keyboard opens)
    setTimeout(() => {
      textareaRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }, 300); // Delay for iOS keyboard animation
    onFocus?.(e);
  };

  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        // iOS Safari touch optimization
        "touch-manipulation cursor-text appearance-none",
        // Ensure proper sizing on iOS (prevents zoom on focus)
        "text-[16px] sm:text-sm",
        className,
      )}
      ref={textareaRef}
      onFocus={handleFocus}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
