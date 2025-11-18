/**
 * FrameContent Widget
 *
 * Main content area for frames
 */

import type { FrameContentProps, RendererProps } from '../types';

export function FrameContent({
  children,
  isExpanded = false,
  visible = true,
  id,
  testId,
  aria,
  __path,
  __render,
}: FrameContentProps & Partial<RendererProps>) {
  if (visible === false) return null;

  return (
    <div
      id={id}
      data-testid={testId}
      className={`flex-1 min-h-0 min-w-full ${isExpanded ? 'overflow-y-auto' : 'overflow-hidden'}`}
      {...aria}
    >
      {__render && Array.isArray(children) && __path
        ? children.map((child, i) => __render(child, `${__path}.children[${i}]`))
        : (children as React.ReactNode)}
    </div>
  );
}
