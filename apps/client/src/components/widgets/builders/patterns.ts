/**
 * Pattern Widget Builders
 *
 * Higher-level builders for common widget composition patterns.
 */

import type {
  KeyValueRowProps,
  KeyValueListProps,
  ButtonGroupProps,
  ButtonProps,
  WidgetNode,
} from '../types';
import { text } from './primitives';

// ============================================================================
// Key-Value Pattern
// ============================================================================

export interface KeyValueField {
  label: string;
  value: string | number | WidgetNode;
  emphasis?: boolean;
}

export const keyValueRow = (
  label: string,
  value: string | number | WidgetNode,
  options?: Partial<Omit<KeyValueRowProps, 'type' | 'label' | 'value'>>,
): KeyValueRowProps => {
  // Auto-convert string/number to Text widget
  const valueNode: WidgetNode =
    typeof value === 'string' || typeof value === 'number'
      ? text(String(value), { weight: 'bold', color: 'emphasis' })
      : value;

  return {
    type: 'KeyValueRow',
    label,
    value: valueNode,
    ...options,
  };
};

export const keyValueList = (
  items: KeyValueField[] | KeyValueRowProps[],
  options?: Partial<Omit<KeyValueListProps, 'type' | 'items'>>,
): KeyValueListProps => {
  // Auto-convert field objects to KeyValueRowProps
  const rowItems: KeyValueRowProps[] = items.map((item) => {
    // Already a KeyValueRowProps
    if ('type' in item && item.type === 'KeyValueRow') {
      return item;
    }

    // Convert KeyValueField to KeyValueRowProps
    const field = item as KeyValueField;
    return keyValueRow(field.label, field.value, {
      emphasis: field.emphasis,
    });
  });

  return {
    type: 'KeyValueList',
    items: rowItems,
    gap: 'md',
    dividers: true,
    ...options,
  };
};

// ============================================================================
// Button Group Pattern
// ============================================================================

export const buttonGroup = (
  buttons: ButtonProps[],
  options?: Partial<Omit<ButtonGroupProps, 'type' | 'buttons'>>,
): ButtonGroupProps => ({
  type: 'ButtonGroup',
  buttons,
  gap: 'md',
  position: 'static',
  ...options,
});
