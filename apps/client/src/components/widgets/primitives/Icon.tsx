/**
 * Icon Primitive
 *
 * Icon display using lucide-react icons.
 */

import { createElement } from 'react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IconProps, RendererProps } from '../types';

export function Icon({
  name,
  size = 'md',
  color = 'default',
  visible = true,
  id,
  testId,
  aria,
}: IconProps & RendererProps) {
  if (!visible) return null;

  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const colorClasses = {
    default: 'text-widget-fg-default',
    secondary: 'text-widget-fg-secondary',
    emphasis: 'text-widget-fg-emphasis',
    muted: 'text-widget-fg-muted',
    danger: 'text-widget-fg-danger',
    success: 'text-widget-fg-success',
    warning: 'text-widget-fg-warning',
  };

  // Get the icon component from lucide-react
  const IconComponent = (LucideIcons as any)[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in lucide-react`);
    return null;
  }

  return createElement(IconComponent, {
    id,
    'data-testid': testId,
    className: cn('widget-icon', sizeClasses[size], colorClasses[color]),
    ...aria,
  });
}
