import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sanitizeFileName(fileName: string): string {
  // Get extension
  const lastDot = fileName.lastIndexOf('.');
  const name = lastDot > 0 ? fileName.slice(0, lastDot) : fileName;
  const ext = lastDot > 0 ? fileName.slice(lastDot) : '';
  
  // Normalize and replace special characters
  const sanitized = name
    .normalize('NFD') // Decompose accents (é → e + ́)
    .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
    .replace(/[^a-zA-Z0-9_-]/g, '_') // Replace unsafe chars with underscore
    .replace(/_+/g, '_') // Collapse multiple underscores
    .replace(/^_|_$/g, ''); // Trim leading/trailing underscores
  
  return sanitized + ext.toLowerCase();
}
