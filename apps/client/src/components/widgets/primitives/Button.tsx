/**
 * Button Primitive
 *
 * Action button with two variants: outline and solid.
 * Follows the modal button pattern from OpenAIVoiceInterface.
 */

import { createElement } from 'react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ButtonProps, RendererProps } from '../types';

export function Button({
  label,
  variant = 'solid',
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

  // Size mappings
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg',
  };

  // Variant styles matching OpenAIVoiceInterface pattern
  const variantClasses = {
    outline: 'bg-gray-900/30 ring-1 ring-gray-200/50 text-white hover:bg-gray-700',
    solid: 'bg-white text-black hover:bg-gray-100',
  };

  return (
    <button
      id={id}
      data-testid={testId}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        'rounded-lg transition-colors font-momo font-semibold tracking-[0.64px]',
        sizeClasses[size],
        variantClasses[variant],
        fullWidth && 'flex-1',
        disabled && 'opacity-50 cursor-not-allowed',
        'flex gap-2 items-center justify-center'
      )}
      {...aria}
    >
      {IconComponent && iconPosition === 'left' && (
        createElement(IconComponent, { className: 'w-4 h-4' })
      )}
      <span className="overflow-ellipsis overflow-hidden shrink-0">{label}</span>
      {IconComponent && iconPosition === 'right' && (
        createElement(IconComponent, { className: 'w-4 h-4' })
      )}
    </button>
  );
}
