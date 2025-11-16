/**
 * Badge Primitive
 *
 * Status indicator badge.
 */

import { cn } from '@/lib/utils';
import { Badge as BadgeUI } from '@/components/ui/badge';
import type { BadgeProps, RendererProps } from '../types';

export function Badge({
  label,
  variant = 'default',
  size = 'sm',
  visible = true,
  id,
  testId,
  aria,
}: BadgeProps & RendererProps) {
  if (!visible) return null;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };

  // Map our variant names to shadcn/ui badge variants with Uber-style black/white theme
  const variantMap = {
    default: 'default',
    secondary: 'secondary',
    success: 'default',
    warning: 'default',
    danger: 'destructive',
    outline: 'outline',
  } as const;

  // Uber-style black and white color classes
  const customColorClasses = {
    success: 'bg-black hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-200 dark:text-black border-0',
    warning: 'bg-gray-200 hover:bg-gray-300 text-black dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-700',
  };

  const mappedVariant = variantMap[variant];
  const customClass = variant === 'success' || variant === 'warning'
    ? customColorClasses[variant]
    : '';

  return (
    <BadgeUI
      id={id}
      data-testid={testId}
      variant={mappedVariant}
      className={cn('widget-badge', sizeClasses[size], customClass)}
      {...aria}
    >
      {label}
    </BadgeUI>
  );
}
