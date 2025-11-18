/**
 * JSON Compatibility Utilities
 *
 * Functions for importing/exporting widgets as pure JSON.
 * Ensures widgets can be:
 * - Loaded from external sources (API, DB, files)
 * - Serialized for storage/transmission
 * - Validated at runtime
 */

import type { WidgetNode } from '../types';
import { validateWidget, safeValidateWidget } from '../schemas';

// ============================================================================
// Import/Export Functions
// ============================================================================

/**
 * Load widget from JSON string or object
 *
 * Validates the JSON and returns a typed WidgetNode.
 * Throws if validation fails.
 *
 * @param json - JSON string or object
 * @returns Validated WidgetNode
 * @throws {Error} If JSON is invalid or doesn't match schema
 *
 * @example
 * ```ts
 * const widget = fromJSON('{"type":"Text","value":"Hello"}');
 * const widget = fromJSON({ type: 'Text', value: 'Hello' });
 * ```
 */
export const fromJSON = (json: string | object): WidgetNode => {
  const obj = typeof json === 'string' ? JSON.parse(json) : json;
  return validateWidget(obj);
};

/**
 * Safely load widget from JSON
 *
 * Returns a Result type instead of throwing.
 *
 * @param json - JSON string or object
 * @returns Result object with success flag and data/error
 *
 * @example
 * ```ts
 * const result = safeFromJSON(data);
 * if (result.success) {
 *   console.log(result.data); // WidgetNode
 * } else {
 *   console.error(result.error); // Error
 * }
 * ```
 */
export const safeFromJSON = (
  json: string | object,
): { success: true; data: WidgetNode } | { success: false; error: Error } => {
  try {
    const obj = typeof json === 'string' ? JSON.parse(json) : json;
    const result = safeValidateWidget(obj);

    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

/**
 * Export widget to JSON string
 *
 * @param widget - WidgetNode to serialize
 * @param pretty - Pretty print with indentation (default: true)
 * @returns JSON string
 *
 * @example
 * ```ts
 * const json = toJSON(widget);
 * const minified = toJSON(widget, false);
 * ```
 */
export const toJSON = (widget: WidgetNode, pretty: boolean = true): string => {
  return JSON.stringify(widget, null, pretty ? 2 : 0);
};

/**
 * Type guard for runtime checking
 *
 * @param obj - Unknown object to check
 * @returns True if object is a valid WidgetNode
 *
 * @example
 * ```ts
 * if (isValidWidget(data)) {
 *   <WidgetRenderer spec={data} />
 * }
 * ```
 */
export const isValidWidget = (obj: unknown): obj is WidgetNode => {
  try {
    validateWidget(obj);
    return true;
  } catch {
    return false;
  }
};

// ============================================================================
// Template Utilities
// ============================================================================

/**
 * Hydrate a widget template with data
 *
 * Replaces placeholders like {{key}} with values from data object.
 *
 * @param template - Widget template with placeholders
 * @param data - Data object with values
 * @returns Hydrated WidgetNode
 *
 * @example
 * ```ts
 * const template = {
 *   type: 'Text',
 *   value: 'Hello {{name}}'
 * };
 *
 * const widget = hydrateTemplate(template, { name: 'World' });
 * // { type: 'Text', value: 'Hello World' }
 * ```
 */
export const hydrateTemplate = (template: any, data: Record<string, any>): WidgetNode => {
  const json = JSON.stringify(template);
  const hydrated = json.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = data[key];
    if (value === undefined) {
      console.warn(`Missing template value for key: ${key}`);
      return `{{${key}}}`;
    }
    return typeof value === 'string' ? value : String(value);
  });
  return fromJSON(hydrated);
};

/**
 * Clone a widget (deep copy)
 *
 * @param widget - WidgetNode to clone
 * @returns Deep copy of widget
 */
export const cloneWidget = (widget: WidgetNode): WidgetNode => {
  return fromJSON(JSON.stringify(widget));
};
