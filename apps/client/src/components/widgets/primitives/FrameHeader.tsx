/**
 * FrameHeader Widget
 *
 * Container for frame header content (title and actions)
 */

import type { FrameHeaderProps, RendererProps } from '../types';

export function FrameHeader({
  children,
  visible = true,
  id,
  testId,
  aria,
  __path,
  __render,
}: FrameHeaderProps & Partial<RendererProps>) {
  if (visible === false) return null;

  return (
    <div
      id={id}
      data-testid={testId}
      className="flex gap-4 items-start justify-center w-full shrink-0"
      {...aria}
    >
      {__render && Array.isArray(children) && __path
        ? children.map((child, i) => __render(child, `${__path}.children[${i}]`))
        : (children as React.ReactNode)}
    </div>
  );
}
