/**
 * Button Primitive
 *
 * Action button with icon support.
 */

import { createElement } from 'react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button as ButtonUI } from '@/components/ui/button';
import type { ButtonProps, RendererProps } from '../types';

export function Button({
  label,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  onClickAction,
  visible = true,
  id,
  testId,
  aria,
  __path,
  __onAction,
}: ButtonProps & RendererProps) {
  if (!visible) return null;

  const handleClick = () => {
    if (onClickAction) {
      __onAction(onClickAction, { node: { label }, path: __path });
    }
  };

  // Get icon component if specified
  const IconComponent = icon ? (LucideIcons as any)[icon] : null;

  return (
    <ButtonUI
      id={id}
      data-testid={testId}
      variant={variant}
      size={size}
      disabled={disabled}
      onClick={handleClick}
      className={cn('widget-button', fullWidth && 'w-full')}
      {...aria}
    >
      {IconComponent && iconPosition === 'left' && (
        createElement(IconComponent, { className: 'mr-2 h-4 w-4' })
      )}
      {label}
      {IconComponent && iconPosition === 'right' && (
        createElement(IconComponent, { className: 'ml-2 h-4 w-4' })
      )}
    </ButtonUI>
  );
}
