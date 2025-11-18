/**
 * Frame Primitive
 *
 * Container widget with built-in close and expand buttons.
 * Implements the modal styling pattern used throughout the application.
 *
 * Every Frame automatically includes:
 * - Close button (always visible)
 * - Expand button (mobile only)
 * - Header with title (if title prop provided)
 *
 * State Management:
 * - Default: Frame manages its own expand state internally
 * - Override: Pass onClose/onExpand/isExpanded props to control from parent
 * - Hybrid: Pass some props to override, omit others for internal handling
 *
 * For additional header content, use:
 * - FrameHeader: Container for custom header content
 * - FrameTitle: Title text (alternative to title prop)
 * - FrameContent: Main content area
 *
 * Supports two rendering modes:
 * 1. JSON Widget Mode: When used via WidgetRenderer with __render prop
 *    - Expects children: WidgetNode[]
 *    - Renders children via __render function
 * 2. Direct React Mode: When used directly in TSX
 *    - Accepts React.ReactNode at runtime when __render is undefined
 *    - Falls through to render children as-is
 *
 * Note: TypeScript type is WidgetNode[] for JSON spec correctness,
 * but runtime safely handles React.ReactNode when __render is undefined.
 */

import { useState } from 'react';
import { X, Maximize2 } from 'lucide-react';
import type { FrameProps, RendererProps } from '../types';

export function Frame({
  children,
  title,
  onClose,
  onExpand,
  isExpanded: externalIsExpanded,
  visible = true,
  id,
  testId,
  aria,
  __path,
  __render,
  className = '',
}: FrameProps & Partial<RendererProps>) {
  const [internalIsExpanded, setInternalIsExpanded] = useState(false);

  if (visible === false) return null;

  // Use external expand state if provided, otherwise use internal
  const isExpanded = externalIsExpanded !== undefined ? externalIsExpanded : internalIsExpanded;

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      // Default behavior - just log
      console.log('Frame close clicked');
    }
  };

  const handleExpand = () => {
    if (onExpand) {
      onExpand();
    } else {
      // Default behavior - toggle internal state
      setInternalIsExpanded(!internalIsExpanded);
    }
  };

  return (
    <div
      id={id}
      data-testid={testId}
      className={`bg-black rounded-[32px] p-10 flex flex-col gap-10 items-start relative w-full min-h-[240px] h-full ${className}`}
      {...aria}
    >
      <div className="absolute border border-black border-solid inset-[-8px] rounded-[40px] pointer-events-none" />

      {/* Header with title and action buttons - Always rendered if title exists */}
      {title && (
        <div className="flex gap-4 items-start justify-center w-full shrink-0">
          <p className="flex-1 font-momo font-semibold text-2xl leading-8 text-white whitespace-pre-wrap min-h-0 min-w-0">
            {title}
          </p>
          <div className="flex gap-2 items-center">
            {/* Expand Button - Mobile only */}
            <button
              onClick={handleExpand}
              className="md:hidden flex items-center justify-center px-0 py-1 shrink-0 hover:opacity-80 transition-opacity"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              <Maximize2 className="w-6 h-6 text-white" />
            </button>
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="flex items-center justify-center px-0 py-1 shrink-0 hover:opacity-80 transition-opacity"
              aria-label="Close"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Children - composable frame components or any widget content */}
      <div className={`flex-1 min-h-0 min-w-full ${isExpanded ? 'overflow-y-auto' : 'overflow-hidden'}`}>
        {__render && Array.isArray(children) && __path
          ? children.map((child, i) => __render(child, `${__path}.children[${i}]`))
          : (children as React.ReactNode)}
      </div>
    </div>
  );
}
