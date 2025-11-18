/**
 * FrameExpand Widget
 *
 * Expand/collapse button for frame headers (mobile only)
 */

import { Maximize2 } from 'lucide-react';
import type { FrameExpandProps, RendererProps } from '../types';

export function FrameExpand({
  onExpand,
  isExpanded = false,
  visible = true,
  id,
  testId,
  aria,
}: FrameExpandProps & Partial<RendererProps>) {
  if (visible === false) return null;

  return (
    <button
      id={id}
      data-testid={testId}
      onClick={onExpand}
      className="md:hidden flex items-center justify-center px-0 py-1 shrink-0 hover:opacity-80 transition-opacity"
      aria-label={isExpanded ? "Collapse" : "Expand"}
      {...aria}
    >
      <Maximize2 className="w-6 h-6 text-white" />
    </button>
  );
}
