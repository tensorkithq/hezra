/**
 * WidgetDisclosure
 *
 * Transparent overlay component that provides close and expand controls for widgets.
 * Renders X and Maximize icons absolutely positioned at top-right with high z-index.
 *
 * Not part of the widget system - this is a pure React component for modal chrome.
 * Wraps Frame or other widget content to provide dismissible/expandable functionality.
 *
 * The wrapped content (typically Frame) should allocate 60px from the right and
 * 60px height to ensure space for these controls.
 */

import { X, Maximize2 } from 'lucide-react';

export interface WidgetDisclosureProps {
  children: React.ReactNode;
  onClose?: () => void;
  onExpand?: () => void;
  isExpanded?: boolean;
  className?: string;
}

export function WidgetDisclosure({
  children,
  onClose,
  onExpand,
  isExpanded = false,
  className = '',
}: WidgetDisclosureProps) {
  return (
    <div className={`relative bg-black rounded-[32px] min-h-min ${className}`}>
      {/* Close and Expand controls - absolutely positioned top-right */}
      <div className="absolute top-10 right-10 z-50 flex gap-2 items-center">
        {/* Expand Button - Mobile only */}
        {onExpand && (
          <button
            onClick={onExpand}
            className="md:hidden flex items-center justify-center px-0 py-1 shrink-0 hover:opacity-80 transition-opacity"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
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

      {/* Widget content */}
      {children}
    </div>
  );
}
