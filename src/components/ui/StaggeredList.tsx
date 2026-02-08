import { motion, Variants } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StaggeredListProps {
  children: ReactNode[];
  className?: string;
  staggerDelay?: number;
  initialDelay?: number;
  direction?: "up" | "down" | "left" | "right";
}

const getItemVariants = (direction: string): Variants => {
  const offset = {
    up: { y: 16, x: 0 },
    down: { y: -16, x: 0 },
    left: { x: 16, y: 0 },
    right: { x: -16, y: 0 },
  }[direction] || { y: 16, x: 0 };

  return {
    hidden: { opacity: 0, ...offset },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };
};

export function StaggeredList({
  children,
  className,
  staggerDelay = 0.08,
  initialDelay = 0.1,
  direction = "up",
}: StaggeredListProps) {
  const itemVariants = getItemVariants(direction);

  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: initialDelay,
          },
        },
      }}
    >
      {children.map((child, index) => (
        <motion.div key={index} variants={itemVariants} className="overflow-hidden">
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
