/**
 * KeyValueList Pattern Component
 *
 * List of key-value rows with optional dividers.
 */

import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import type { KeyValueListProps, RendererProps } from '../types';

export function KeyValueList({
  items,
  gap = 'md',
  dividers = false,
  visible = true,
  id,
  testId,
  aria,
  __path,
  __render,
}: KeyValueListProps & RendererProps) {
  if (!visible) return null;

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
      className={cn('widget-keyvalue-list flex flex-col', gapClasses[gap])}
      {...aria}
    >
      {items.map((item, i) => (
        <div key={item.key || i}>
          {__render(item, `${__path}.items[${i}]`)}
          {dividers && i < items.length - 1 && (
            <Separator className="my-2" />
          )}
        </div>
      ))}
    </div>
  );
}
