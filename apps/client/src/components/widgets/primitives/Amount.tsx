/**
 * Amount Primitive
 *
 * Currency/number display with formatting.
 */

import { cn } from '@/lib/utils';
import type { AmountProps, RendererProps } from '../types';

export function Amount({
  value,
  currency,
  showCurrency = true,
  size = 'md',
  weight = 'regular',
  color = 'default',
  visible = true,
  id,
  testId,
  aria,
}: AmountProps & RendererProps) {
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
    success: 'text-widget-fg-success',
    danger: 'text-widget-fg-danger',
    warning: 'text-widget-fg-warning',
  };

  // Format the amount
  const formattedValue = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

  const displayValue = showCurrency && currency
    ? `${currency} ${formattedValue}`
    : formattedValue;

  return (
    <span
      id={id}
      data-testid={testId}
      className={cn(
        'widget-amount',
        sizeClasses[size],
        weightClasses[weight],
        colorClasses[color]
      )}
      {...aria}
    >
      {displayValue}
    </span>
  );
}
