/**
 * Utility for combining class names with Tailwind CSS
 * Uses clsx for conditional classes and tailwind-merge to handle conflicts
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names intelligently, resolving Tailwind conflicts
 * @param inputs - Class names to combine
 * @returns Combined class string
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
