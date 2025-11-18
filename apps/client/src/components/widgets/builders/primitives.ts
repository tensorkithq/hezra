/**
 * Primitive Widget Builders
 *
 * Type-safe builder functions for creating primitive widget JSON nodes.
 * These builders provide:
 * - TypeScript inference
 * - Default values
 * - Compile-time validation
 */

import type {
  FrameProps,
  FrameHeaderProps,
  FrameTitleProps,
  FrameActionsProps,
  FrameContentProps,
  RowProps,
  ColProps,
  SpacerProps,
  DividerProps,
  TextProps,
  AvatarProps,
  AmountProps,
  TimeProps,
  IconProps,
  BadgeProps,
  ButtonProps,
  WidgetNode,
} from '../types';

// ============================================================================
// Layout Primitives
// ============================================================================

export const frame = (
  children: WidgetNode[],
  options?: Partial<Omit<FrameProps, 'type' | 'children'>>,
): FrameProps => ({
  type: 'Frame',
  children,
  ...options,
});

export const frameHeader = (
  children: WidgetNode[],
  options?: Partial<Omit<FrameHeaderProps, 'type' | 'children'>>,
): FrameHeaderProps => ({
  type: 'FrameHeader',
  children,
  ...options,
});

export const frameTitle = (
  value: string,
  options?: Partial<Omit<FrameTitleProps, 'type' | 'value'>>,
): FrameTitleProps => ({
  type: 'FrameTitle',
  value,
  ...options,
});

export const frameActions = (
  children: WidgetNode[],
  options?: Partial<Omit<FrameActionsProps, 'type' | 'children'>>,
): FrameActionsProps => ({
  type: 'FrameActions',
  children,
  ...options,
});

export const frameContent = (
  children: WidgetNode[],
  options?: Partial<Omit<FrameContentProps, 'type' | 'children'>>,
): FrameContentProps => ({
  type: 'FrameContent',
  children,
  ...options,
});

export const row = (
  children: WidgetNode[],
  options?: Partial<Omit<RowProps, 'type' | 'children'>>,
): RowProps => ({
  type: 'Row',
  gap: 'md',
  align: 'start',
  children,
  ...options,
});

export const col = (
  children: WidgetNode[],
  options?: Partial<Omit<ColProps, 'type' | 'children'>>,
): ColProps => ({
  type: 'Col',
  gap: 'md',
  children,
  ...options,
});

export const spacer = (options?: Partial<Omit<SpacerProps, 'type'>>): SpacerProps => ({
  type: 'Spacer',
  grow: 1,
  ...options,
});

export const divider = (options?: Partial<Omit<DividerProps, 'type'>>): DividerProps => ({
  type: 'Divider',
  orientation: 'horizontal',
  spacing: 'md',
  ...options,
});

// ============================================================================
// Content Primitives
// ============================================================================

export const text = (
  value: string,
  options?: Partial<Omit<TextProps, 'type' | 'value'>>,
): TextProps => ({
  type: 'Text',
  value,
  ...options,
});

export const avatar = (options?: Partial<Omit<AvatarProps, 'type'>>): AvatarProps => ({
  type: 'Avatar',
  size: 'md',
  shape: 'circle',
  ...options,
});

export const amount = (
  value: number,
  options?: Partial<Omit<AmountProps, 'type' | 'value'>>,
): AmountProps => ({
  type: 'Amount',
  value,
  ...options,
});

export const time = (
  value: string,
  options?: Partial<Omit<TimeProps, 'type' | 'value'>>,
): TimeProps => ({
  type: 'Time',
  value,
  format: 'relative',
  ...options,
});

export const icon = (
  name: string,
  options?: Partial<Omit<IconProps, 'type' | 'name'>>,
): IconProps => ({
  type: 'Icon',
  name,
  size: 'md',
  color: 'default',
  ...options,
});

export const badge = (
  label: string,
  options?: Partial<Omit<BadgeProps, 'type' | 'label'>>,
): BadgeProps => ({
  type: 'Badge',
  label,
  variant: 'default',
  size: 'sm',
  ...options,
});

// ============================================================================
// Interactive Primitives
// ============================================================================

export const button = (
  label: string,
  options?: Partial<Omit<ButtonProps, 'type' | 'label'>>,
): ButtonProps => ({
  type: 'Button',
  label,
  variant: 'outline',
  size: 'md',
  ...options,
});
