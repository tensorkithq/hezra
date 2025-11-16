/**
 * ButtonGroup Pattern Component
 *
 * Group of buttons with layout control.
 */

import { cn } from '@/lib/utils';
import type { ButtonGroupProps, RendererProps } from '../types';

export function ButtonGroup({
  buttons,
  orientation = 'horizontal',
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
    sm: 'widget-gap-sm',
    md: 'widget-gap-md',
    lg: 'widget-gap-lg',
  };

  const orientationClasses = {
    horizontal: 'flex-row',
    vertical: 'flex-col',
  };

  return (
    <div
      id={id}
      data-testid={testId}
      className={cn(
        'widget-button-group flex',
        orientationClasses[orientation],
        gapClasses[gap]
      )}
      {...aria}
    >
      {buttons.map((button, i) =>
        __render(button, `${__path}.buttons[${i}]`)
      )}
    </div>
  );
}
