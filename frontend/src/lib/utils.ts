import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * cn — Class Name utility
 *
 * Combines clsx (conditional class logic) with tailwind-merge
 * (conflict resolution for Tailwind classes).
 *
 * Usage:
 *   cn('base-class', isActive && 'active-class', className)
 *   cn('px-4 py-2', size === 'lg' && 'px-6 py-3')
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * formatDate — Formats a date string or Date object for display.
 * Uses the user's locale automatically.
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  }).format(new Date(date))
}

/**
 * formatDateTime — Formats a date + time for display.
 */
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date))
}
