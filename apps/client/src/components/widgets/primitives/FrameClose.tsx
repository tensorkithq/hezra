/**
 * FrameClose Widget
 *
 * Close button for frame headers
 */

import { X } from 'lucide-react';
import type { FrameCloseProps, RendererProps } from '../types';

export function FrameClose({
  onClose,
  visible = true,
  id,
  testId,
  aria,
}: FrameCloseProps & Partial<RendererProps>) {
  if (visible === false) return null;

  return (
    <button
      id={id}
      data-testid={testId}
      onClick={onClose}
      className="flex items-center justify-center px-0 py-1 shrink-0 hover:opacity-80 transition-opacity"
      aria-label="Close"
      {...aria}
    >
      <X className="w-6 h-6 text-white" />
    </button>
  );
}
