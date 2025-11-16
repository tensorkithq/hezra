/**
 * Widget Renderer
 *
 * Core renderer that validates and renders widget JSON specifications.
 */

import { validateWidget } from './schemas';
import { getWidget } from './registry';
import type { WidgetNode, WidgetRendererProps, Action, RenderOptions } from './types';

// Import primitives to register them
import './primitives';

/**
 * Create a renderer function with context
 */
function createRenderer(opts: RenderOptions) {
  const onAction = opts.onAction || (() => {});

  function renderNode(node: WidgetNode, path: string = '$'): JSX.Element | null {
    // Check visibility
    if (node == null || node.visible === false) {
      return null;
    }

    // Get component from registry
    const Component = getWidget(node.type);
    if (!Component) {
      console.error(`Unknown widget type "${node.type}" at ${path}`);
      return (
        <div className="p-4 border border-destructive rounded-md bg-destructive/10">
          <p className="text-sm text-destructive font-medium">
            Unknown widget type: "{node.type}"
          </p>
          <p className="text-xs text-destructive/70 mt-1">Path: {path}</p>
        </div>
      );
    }

    // Render component with internal props
    return (
      <Component
        {...(node as any)}
        key={node.key || path}
        __path={path}
        __onAction={onAction}
        __render={renderNode}
      />
    );
  }

  return renderNode;
}

/**
 * Widget Renderer Component
 *
 * Validates and renders a widget specification from JSON.
 */
export function WidgetRenderer({ spec, options = {} }: WidgetRendererProps) {
  try {
    // Validate the widget specification
    const validatedSpec = validateWidget(spec);

    // Create renderer with options
    const render = createRenderer(options);

    // Render the validated spec
    return render(validatedSpec);
  } catch (error: any) {
    // Handle validation errors
    console.error('Widget validation error:', error);

    return (
      <div className="p-4 border border-destructive rounded-md bg-destructive/10">
        <p className="text-sm text-destructive font-medium">Widget Validation Error</p>
        <pre className="text-xs text-destructive/70 mt-2 overflow-x-auto">
          {error.message || 'Unknown error'}
        </pre>
        {error.issues && (
          <div className="mt-2">
            <p className="text-xs text-destructive/70 font-medium">Issues:</p>
            <ul className="text-xs text-destructive/70 list-disc list-inside mt-1">
              {error.issues.map((issue: any, i: number) => (
                <li key={i}>
                  {issue.path.join('.')}: {issue.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
}

/**
 * Safe widget renderer that doesn't throw
 */
export function SafeWidgetRenderer({ spec, options = {} }: WidgetRendererProps) {
  try {
    return <WidgetRenderer spec={spec} options={options} />;
  } catch (error) {
    console.error('Fatal widget rendering error:', error);
    return (
      <div className="p-4 border border-destructive rounded-md bg-destructive/10">
        <p className="text-sm text-destructive font-medium">
          Failed to render widget
        </p>
      </div>
    );
  }
}

// Export types
export type { WidgetNode, WidgetRendererProps, Action, RenderOptions };
