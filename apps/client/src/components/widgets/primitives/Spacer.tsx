/**
 * Spacer Primitive
 *
 * Flexible space for layout adjustments.
 */

import type { SpacerProps, RendererProps } from '../types';

export function Spacer({
  grow = 1,
  visible = true,
  id,
  testId,
  aria,
}: SpacerProps & RendererProps) {
  if (!visible) return null;

  return (
    <div
      id={id}
      data-testid={testId}
      style={{ flexGrow: grow }}
      {...aria}
    />
  );
}
