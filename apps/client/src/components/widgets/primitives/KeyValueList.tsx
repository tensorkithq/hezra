/**
 * KeyValueList Pattern Component
 *
 * List of key-value rows with optional dividers.
 * Matches the OpenAIVoiceInterface modal pattern with proper styling.
 */

import { cn } from '@/lib/utils';
import type { KeyValueListProps, RendererProps } from '../types';

export function KeyValueList({
  items,
  gap = 'md',
  dividers = true,
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
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <div
            key={item.key || i}
            className={cn(
              'flex gap-2 items-center justify-center w-full text-base leading-6 text-white shrink-0',
              dividers && !isLast && 'border-b border-white/16 pb-4'
            )}
          >
            {__render(item, `${__path}.items[${i}]`)}
          </div>
        );
      })}
    </div>
  );
}
