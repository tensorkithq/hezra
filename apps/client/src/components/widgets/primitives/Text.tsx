/**
 * Text Primitive
 *
 * Text display with size, weight, color, and semantic HTML support.
 */

import { createElement } from 'react';
import { cn } from '@/lib/utils';
import type { TextProps, RendererProps } from '../types';

export function Text({
  value,
  size = 'md',
  weight = 'regular',
  color = 'default',
  emphasis = false,
  truncate = false,
  as = 'span',
  visible = true,
  id,
  testId,
  aria,
}: TextProps & RendererProps) {
  if (!visible) return null;

  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  const weightClasses = {
    regular: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
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

  return createElement(
    as,
    {
      id,
      'data-testid': testId,
      className: cn(
        sizeClasses[size],
        weightClasses[weight],
        colorClasses[color],
        emphasis && 'font-bold',
        truncate && 'truncate',
        'widget-text'
      ),
      ...aria,
    },
    value
  );
}
