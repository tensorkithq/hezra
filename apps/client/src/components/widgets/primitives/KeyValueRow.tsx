/**
 * KeyValueRow Pattern Component
 *
 * Single label-value pair display.
 */

import { cn } from '@/lib/utils';
import type { KeyValueRowProps, RendererProps } from '../types';

export function KeyValueRow({
  label,
  value,
  emphasis = false,
  visible = true,
  id,
  testId,
  aria,
  __path,
  __render,
}: KeyValueRowProps & RendererProps) {
  if (!visible) return null;

  return (
    <div
      id={id}
      data-testid={testId}
      className={cn('widget-keyvalue-row flex justify-between items-center')}
      {...aria}
    >
      <span className="text-sm text-widget-fg-secondary">{label}</span>
      <div className={cn(emphasis && 'font-semibold')}>
        {__render(value, `${__path}.value`)}
      </div>
    </div>
  );
}
