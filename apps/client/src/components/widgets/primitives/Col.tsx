/**
 * Col Primitive
 *
 * Vertical layout container with flex.
 */

import { cn } from '@/lib/utils';
import type { ColProps, RendererProps } from '../types';

export function Col({
  gap = 'md',
  align = 'start',
  children,
  visible = true,
  id,
  testId,
  aria,
  __path,
  __render,
}: ColProps & RendererProps) {
  if (!visible) return null;

  const alignClasses = {
    start: 'justify-start items-start',
    center: 'justify-center items-center',
    end: 'justify-end items-end',
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
        'flex flex-col',
        alignClasses[align],
        gapClasses[gap]
      )}
      {...aria}
    >
      {children?.map((child, i) =>
        __render(child, `${__path}.children[${i}]`)
      )}
    </div>
  );
}
