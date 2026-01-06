import { motion, Variants } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StaggeredGridProps {
  children: ReactNode[];
  className?: string;
  columns?: string;
  staggerDelay?: number;
  initialDelay?: number;
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export function StaggeredGrid({
  children,
  className,
  columns = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  staggerDelay = 0.06,
  initialDelay = 0.05,
}: StaggeredGridProps) {
  return (
    <motion.div
      className={cn("grid gap-4", columns, className)}
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
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
