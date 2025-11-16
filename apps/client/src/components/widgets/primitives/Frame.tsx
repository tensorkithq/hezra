/**
 * Frame Primitive
 *
 * Widget container - the default wrapper for all widgets.
 */

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import type { FrameProps, RendererProps } from '../types';

export function Frame({
  size = 'md',
  padding = 'md',
  children,
  visible = true,
  id,
  testId,
  aria,
  __path,
  __render,
}: FrameProps & RendererProps) {
  if (!visible) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    full: 'w-full',
  };

  const paddingClasses = {
    none: 'p-0',
    sm: 'widget-padding-sm',
    md: 'widget-padding-md',
    lg: 'widget-padding-lg',
  };

  return (
    <Card
      id={id}
      data-testid={testId}
      className={cn('widget-frame', sizeClasses[size])}
      {...aria}
    >
      <CardContent className={cn(paddingClasses[padding])}>
        {children?.map((child, i) =>
          __render(child, `${__path}.children[${i}]`)
        )}
      </CardContent>
    </Card>
  );
}
