/**
 * Widget Component Registry
 *
 * Maps widget type strings to React components for rendering.
 */

import type { ComponentType } from 'react';
import type { WidgetNode, RendererProps } from './types';

// Component registry type
export type WidgetComponent = ComponentType<WidgetNode & RendererProps>;

// Registry mapping widget types to components
export const primitiveRegistry: Record<string, WidgetComponent> = {};

/**
 * Register a widget component
 */
export function registerWidget(type: string, component: WidgetComponent) {
  primitiveRegistry[type] = component;
}

/**
 * Get a widget component by type
 */
export function getWidget(type: string): WidgetComponent | undefined {
  return primitiveRegistry[type];
}

/**
 * Check if a widget type is registered
 */
export function hasWidget(type: string): boolean {
  return type in primitiveRegistry;
}
