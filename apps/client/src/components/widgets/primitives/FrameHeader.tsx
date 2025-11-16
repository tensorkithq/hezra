/**
 * FrameHeader Primitive
 *
 * Header with title and optional expand icon for fullscreen toggle.
 */

import { Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { FrameHeaderProps, RendererProps } from '../types';

export function FrameHeader({
  title,
  expandable = true,
  actions,
  visible = true,
  id,
  testId,
  aria,
  __path,
  __onAction,
}: FrameHeaderProps & RendererProps) {
  if (!visible) return null;

  const handleExpand = () => {
    __onAction({ type: 'expand', target: 'fullscreen' }, { node: { title }, path: __path });
  };

  return (
    <CardHeader
      id={id}
      data-testid={testId}
      className={cn('flex flex-row items-center justify-between space-y-0 pb-2')}
      {...aria}
    >
      <CardTitle className="text-sm font-medium">{title}</CardTitle>

      {expandable && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handleExpand}
          aria-label="Expand widget"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      )}

      {actions && actions.length > 0 && (
        <div className="flex items-center gap-2">
          {actions.map((action, i) => (
            <Button
              key={i}
              variant="ghost"
              size="sm"
              onClick={() => __onAction(action, { node: { title }, path: __path })}
            >
              {action.type}
            </Button>
          ))}
        </div>
      )}
    </CardHeader>
  );
}
