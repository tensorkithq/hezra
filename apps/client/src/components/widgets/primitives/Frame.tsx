/**
 * Frame Primitive
 *
 * Widget container - the default wrapper for all widgets.
 * Implements the modal styling pattern used throughout the application.
 * Can optionally render a header with title, expand, and close buttons.
 */

import { X, Maximize2 } from 'lucide-react';
import type { FrameProps, RendererProps } from '../types';

export function Frame({
  children,
  visible = true,
  id,
  testId,
  aria,
  __path,
  __render,
  className = '',
  hasHeader = false,
  title,
  onClose,
  onExpand,
  isExpanded = false,
}: FrameProps & Partial<RendererProps>) {
  if (visible === false) return null;

  return (
    <div
      id={id}
      data-testid={testId}
      className={`bg-black rounded-[32px] p-10 flex flex-col gap-10 items-start relative w-full min-h-[240px] h-full ${className}`}
      {...aria}
    >
      {/* Header - Conditionally rendered */}
      {hasHeader && (
        <div className="flex gap-4 items-start justify-center w-full shrink-0">
          <p className="flex-1 font-momo font-semibold text-2xl leading-8 text-white whitespace-pre-wrap min-h-0 min-w-0">
            {title}
          </p>
          <div className="flex gap-2 items-center">
            {/* Expand Button - Only show on mobile */}
            {onExpand && (
              <button
                onClick={onExpand}
                className="md:hidden flex items-center justify-center px-0 py-1 shrink-0 hover:opacity-80 transition-opacity"
                aria-label={isExpanded ? "Collapse" : "Expand"}
              >
                <Maximize2 className="w-6 h-6 text-white" />
              </button>
            )}
            {/* Close Button */}
            {onClose && (
              <button
                onClick={onClose}
                className="flex items-center justify-center px-0 py-1 shrink-0 hover:opacity-80 transition-opacity"
                aria-label="Close"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Children */}
      {__render && Array.isArray(children) && __path
        ? children.map((child, i) => __render(child, `${__path}.children[${i}]`))
        : children}
    </div>
  );
}
