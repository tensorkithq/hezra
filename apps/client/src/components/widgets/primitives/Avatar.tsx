/**
 * Avatar Primitive
 *
 * User/entity avatar display.
 */

import { cn } from '@/lib/utils';
import {
  Avatar as AvatarUI,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import type { AvatarProps, RendererProps } from '../types';

export function Avatar({
  src,
  fallback = '?',
  size = 'md',
  shape = 'circle',
  visible = true,
  id,
  testId,
  aria,
}: AvatarProps & RendererProps) {
  if (!visible) return null;

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  const shapeClasses = {
    circle: 'rounded-full',
    square: 'rounded-md',
  };

  return (
    <AvatarUI
      id={id}
      data-testid={testId}
      className={cn('widget-avatar', sizeClasses[size], shapeClasses[shape])}
      {...aria}
    >
      {src && <AvatarImage src={src} alt={fallback} />}
      <AvatarFallback>{fallback}</AvatarFallback>
    </AvatarUI>
  );
}
