/**
 * Time Primitive
 *
 * Timestamp display with formatting options.
 */

import { cn } from '@/lib/utils';
import type { TimeProps, RendererProps } from '../types';

export function Time({
  value,
  format = 'relative',
  size = 'sm',
  color = 'muted',
  visible = true,
  id,
  testId,
  aria,
}: TimeProps & RendererProps) {
  if (!visible) return null;

  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
  };

  const colorClasses = {
    default: 'text-widget-fg-default',
    secondary: 'text-widget-fg-secondary',
    muted: 'text-widget-fg-muted',
  };

  // Format the timestamp
  const date = new Date(value);
  let displayValue: string;

  switch (format) {
    case 'relative':
      displayValue = getRelativeTime(date);
      break;
    case 'absolute':
      displayValue = date.toLocaleString();
      break;
    case 'time':
      displayValue = date.toLocaleTimeString();
      break;
    case 'date':
      displayValue = date.toLocaleDateString();
      break;
    default:
      displayValue = date.toLocaleString();
  }

  return (
    <time
      id={id}
      data-testid={testId}
      dateTime={value}
      className={cn('widget-time', sizeClasses[size], colorClasses[color])}
      {...aria}
    >
      {displayValue}
    </time>
  );
}

/**
 * Get relative time string (e.g., "2 hours ago", "just now")
 */
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString();
}
