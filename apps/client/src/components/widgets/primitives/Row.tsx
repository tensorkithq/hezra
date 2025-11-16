/**
 * Row Primitive
 *
 * Horizontal layout container with flex.
 */

import { cn } from '@/lib/utils';
import type { RowProps, RendererProps } from '../types';

export function Row({
  align = 'start',
  gap = 'md',
  wrap = false,
  children,
  visible = true,
  id,
  testId,
  aria,
  __path,
  __render,
}: RowProps & RendererProps) {
  if (!visible) return null;

  const alignClasses = {
    start: 'justify-start items-start',
    center: 'justify-center items-center',
    end: 'justify-end items-end',
    between: 'justify-between items-center',
    stretch: 'justify-start items-stretch',
  };

  const gapClasses = {
    none: 'widget-gap-none',
    sm: 'widget-gap-sm',
    md: 'widget-gap-md',
    lg: 'widget-gap-lg',
  };

  return (
    <div
      id={id}
      data-testid={testId}
      className={cn(
        'flex flex-row',
        alignClasses[align],
        gapClasses[gap],
        wrap && 'flex-wrap'
      )}
      {...aria}
    >
      {children?.map((child, i) =>
        __render(child, `${__path}.children[${i}]`)
      )}
    </div>
  );
}
