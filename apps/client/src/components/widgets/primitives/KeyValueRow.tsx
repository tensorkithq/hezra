/**
 * KeyValueRow Pattern Component
 *
 * Single label-value pair display.
 * Matches the OpenAIVoiceInterface modal pattern with proper styling.
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
    <>
      <p className="flex-1 font-momo font-normal min-h-0 min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">
        {label}
      </p>
      <p className={cn('font-momo shrink-0', emphasis ? 'font-bold' : 'font-bold')}>
        {__render(value, `${__path}.value`)}
      </p>
    </>
  );
}
