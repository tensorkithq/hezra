/**
 * Divider Primitive
 *
 * Separator/rule for visual separation.
 */

import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import type { DividerProps, RendererProps } from '../types';

export function Divider({
  orientation = 'horizontal',
  spacing = 'md',
  visible = true,
  id,
  testId,
  aria,
}: DividerProps & RendererProps) {
  if (!visible) return null;

  const spacingClasses = {
    none: 'widget-spacing-none',
    sm: 'widget-spacing-sm',
    md: 'widget-spacing-md',
    lg: 'widget-spacing-lg',
  };

  return (
    <Separator
      id={id}
      data-testid={testId}
      orientation={orientation}
      className={cn(spacingClasses[spacing])}
      role="separator"
      {...aria}
    />
  );
}
