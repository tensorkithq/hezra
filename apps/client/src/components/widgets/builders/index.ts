/**
 * Widget Builders
 *
 * Type-safe builder library for creating widget JSON nodes.
 *
 * @example Primitive builders
 * ```ts
 * import { text, button, frame } from '@/components/widgets/builders';
 *
 * const widget = frame([
 *   text('Hello World', { size: 'lg' }),
 *   button('Click Me', { variant: 'solid' })
 * ]);
 * ```
 *
 * @example Pattern builders
 * ```ts
 * import { keyValueList, buttonGroup } from '@/components/widgets/builders';
 *
 * const widget = keyValueList([
 *   { label: 'Name', value: 'John Doe' },
 *   { label: 'Email', value: 'john@example.com' }
 * ]);
 * ```
 *
 * @example Financial builders
 * ```ts
 * import { financial } from '@/components/widgets/builders';
 *
 * const widget = financial.paymentSummary({
 *   totalAmount: 1000,
 *   currency: 'USD',
 *   recipientCount: 5,
 *   // ...
 * });
 * ```
 *
 * @example JSON utilities
 * ```ts
 * import { fromJSON, toJSON, isValidWidget } from '@/components/widgets/builders';
 *
 * const widget = fromJSON('{"type":"Text","value":"Hello"}');
 * const json = toJSON(widget);
 * if (isValidWidget(data)) { ... }
 * ```
 */

// Export all primitive builders
export * from './primitives';

// Export all pattern builders
export * from './patterns';

// Export financial builders (as namespace and individual exports)
export * from './financial';

// Export JSON utilities
export * from './json';

// Export validated builder wrapper (coming next)
export * from './validated';
