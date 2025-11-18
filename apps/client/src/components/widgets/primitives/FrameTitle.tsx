/**
 * FrameTitle Widget
 *
 * Title text for frame headers
 */

import type { FrameTitleProps, RendererProps } from '../types';

export function FrameTitle({
  value,
  visible = true,
  id,
  testId,
  aria,
}: FrameTitleProps & Partial<RendererProps>) {
  if (visible === false) return null;

  return (
    <p
      id={id}
      data-testid={testId}
      className="flex-1 font-momo font-semibold text-2xl leading-8 text-white whitespace-pre-wrap min-h-0 min-w-0"
      {...aria}
    >
      {value}
    </p>
  );
}
