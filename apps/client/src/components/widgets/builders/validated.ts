/**
 * Validated Builder Wrapper
 *
 * Wraps builder functions with runtime validation.
 * Useful for development and debugging.
 */

import type { WidgetNode } from '../types';
import { validateWidget } from '../schemas';

/**
 * Wrap a builder function with validation
 *
 * Validates the widget output before returning it.
 * Throws if the widget doesn't match the schema.
 *
 * @param builder - Builder function that returns a WidgetNode
 * @returns Validated WidgetNode
 * @throws {Error} If widget is invalid
 *
 * @example
 * ```ts
 * import { validated, text } from '@/components/widgets/builders';
 *
 * const myWidget = validated(() => text('Hello World'));
 * ```
 *
 * @example With complex builder
 * ```ts
 * const widget = validated(() =>
 *   frame([
 *     text('Title', { size: 'lg' }),
 *     keyValueList([
 *       { label: 'Name', value: 'John' }
 *     ])
 *   ])
 * );
 * ```
 */
export const validated = <T extends WidgetNode>(builder: () => T): T => {
  const widget = builder();
  return validateWidget(widget) as T;
};

/**
 * Enable/disable validation globally
 *
 * In production, you might want to disable validation for performance.
 * In development, keep it enabled to catch errors early.
 */
let validationEnabled = process.env.NODE_ENV !== 'production';

export const setValidationEnabled = (enabled: boolean) => {
  validationEnabled = enabled;
};

export const isValidationEnabled = () => validationEnabled;

/**
 * Conditionally validated builder
 *
 * Only validates if validation is enabled.
 * Useful for production builds where validation overhead isn't needed.
 *
 * @param builder - Builder function
 * @returns WidgetNode (validated if enabled)
 */
export const maybeValidated = <T extends WidgetNode>(builder: () => T): T => {
  const widget = builder();
  if (validationEnabled) {
    return validateWidget(widget) as T;
  }
  return widget;
};
