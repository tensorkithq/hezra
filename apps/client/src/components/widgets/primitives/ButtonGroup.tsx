/**
 * ButtonGroup Pattern Component
 *
 * Wraps buttons in a flex container positioned at the bottom of frames.
 * Follows the modal button pattern from OpenAIVoiceInterface.
 */

import { cn } from '@/lib/utils';
import type { ButtonGroupProps, RendererProps } from '../types';

export function ButtonGroup({
  buttons,
  position = 'static',
  gap = 'md',
  visible = true,
  id,
  testId,
  aria,
  __path,
  __render,
}: ButtonGroupProps & RendererProps) {
  if (!visible) return null;

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  };

  const positionClasses = {
    static: '',
    absolute: 'absolute bottom-8 left-4 right-4 md:left-10 md:right-10',
  };

  return (
    <div
      id={id}
      data-testid={testId}
      className={cn(
        'flex',
        gapClasses[gap],
        positionClasses[position]
      )}
      {...aria}
    >
      {buttons.map((button, i) =>
        __render(button, `${__path}.buttons[${i}]`)
      )}
    </div>
  );
}
