/**
 * Frame Primitive
 *
 * Basic container widget - the foundational wrapper for all widgets.
 * Implements the modal styling pattern used throughout the application.
 *
 * Frame is now a simple container. For headers, titles, and actions,
 * use the composable components:
 * - FrameHeader: Container for header content
 * - FrameTitle: Title text
 * - FrameActions: Container for action buttons
 * - FrameClose: Close button
 * - FrameExpand: Expand/collapse button
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
}: FrameProps & Partial<RendererProps>) {
  if (visible === false) return null;

  return (
    <div
      id={id}
      data-testid={testId}
      className={`bg-black rounded-[32px] p-10 flex flex-col gap-10 items-start relative w-full min-h-[240px] h-full ${className}`}
      {...aria}
    >
      <div className="absolute border border-black border-solid inset-[-8px] rounded-[40px] pointer-events-none" />

      {/* Children - composable frame components or any widget content */}
      {__render && Array.isArray(children) && __path
        ? children.map((child, i) => __render(child, `${__path}.children[${i}]`))
        : (children as React.ReactNode)}
    </div>
  );
}
