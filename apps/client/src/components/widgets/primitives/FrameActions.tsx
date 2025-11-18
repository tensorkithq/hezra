/**
 * FrameActions Widget
 *
 * Container for frame header action buttons (close, expand, etc.)
 */

import type { FrameActionsProps, RendererProps } from '../types';

export function FrameActions({
  children,
  visible = true,
  id,
  testId,
  aria,
  __path,
  __render,
}: FrameActionsProps & Partial<RendererProps>) {
  if (visible === false) return null;

  return (
    <div
      id={id}
      data-testid={testId}
      className="flex gap-2 items-center"
      {...aria}
    >
      {__render && Array.isArray(children) && __path
        ? children.map((child, i) => __render(child, `${__path}.children[${i}]`))
        : (children as React.ReactNode)}
    </div>
  );
}
