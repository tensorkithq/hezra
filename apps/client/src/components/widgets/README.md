# Widget System Documentation

## Overview

The Widget System is a JSON-driven UI renderer for displaying interactive financial widgets in the Moniewave Voice Assistant. It provides a declarative way to compose rich UIs from atomic primitives without writing React code.

## How It Works: The Renderer Pattern

### `__render` and `__path` - The Core Mechanism

The widget system uses a **recursive rendering pattern** to convert JSON specifications into React components. Every primitive component receives two special props:

#### `__render` - The Widget Factory Function

```typescript
__render: (node: WidgetNode, path?: string) => JSX.Element | null
```

This function takes a JSON widget node and returns the corresponding React component. Think of it as a "type router" that maps widget types to their implementations:

```typescript
// Simplified example of what __render does internally
function render(node: WidgetNode, path: string) {
  switch (node.type) {
    case 'Button': return <Button {...node} __render={render} __path={path} />;
    case 'Text': return <Text {...node} __render={render} __path={path} />;
    case 'Frame': return <Frame {...node} __render={render} __path={path} />;
    // ... and so on
  }
}
```

#### `__path` - The Breadcrumb Trail

```typescript
__path: string  // Example: "root.children[0].buttons[1]"
```

This tracks the location of each widget in the JSON tree, like a file path. It's used for:
- **Debugging**: Know exactly where errors occur in complex widget trees
- **Action context**: Identify which specific widget triggered an action
- **Unique keys**: Generate stable React keys for list rendering

**Path examples:**
```
"root"                           // Top-level widget
"root.children[0]"               // First child of root
"root.children[1].buttons[2]"    // Third button in second child
```

### Rendering Flow Example

Given this JSON widget:

```json
{
  "type": "Frame",
  "children": [
    {
      "type": "ButtonGroup",
      "buttons": [
        { "type": "Button", "label": "Approve" },
        { "type": "Button", "label": "Reject" }
      ]
    }
  ]
}
```

**What happens:**

1. **WidgetRenderer** starts with `__path = "root"`
2. Calls `__render(frame, "root")` → renders `<Frame>`
3. **Frame** maps over `children[0]` and calls:
   - `__render(children[0], "root.children[0]")` → renders `<ButtonGroup>`
4. **ButtonGroup** maps over `buttons` and calls:
   - `__render(buttons[0], "root.children[0].buttons[0]")` → renders "Approve" button
   - `__render(buttons[1], "root.children[0].buttons[1]")` → renders "Reject" button

**Result**: A tree of React components with traceable paths.

### Real-World Usage in ButtonGroup

```typescript
export function ButtonGroup({
  buttons,
  __path,
  __render,
}: ButtonGroupProps & RendererProps) {
  return (
    <div className="flex gap-2">
      {buttons.map((button, i) =>
        __render(button, `${__path}.buttons[${i}]`)
        //        ^^^^^^  ^^^^^^^^^^^^^^^^^^^^^^^^^^^
        //        |       Extends path: "root.buttons[0]"
        //        Converts JSON → <Button /> component
      )}
    </div>
  );
}
```

**Why this pattern?**
- ✅ **Composability**: Widgets can contain other widgets infinitely deep
- ✅ **Type safety**: Each widget validates its children via Zod schemas
- ✅ **Debuggability**: Errors show the exact path: `"Error at root.children[2].buttons[1]"`
- ✅ **Server-driven UI**: The entire UI structure comes from JSON (ChatGPT tools, APIs, etc.)

### When You Need These Props

**You need `__render` and `__path` when:**
- Creating a **container widget** (Frame, Row, Col, ButtonGroup, etc.)
- Your widget has a `children` or array prop that contains other widgets
- You need to recursively render nested widget trees

**You DON'T need them when:**
- Creating a **leaf widget** (Text, Icon, Badge, etc.)
- Your widget has no children or nested widgets
- You're using the widget outside the JSON system (direct React usage)

### Direct React Usage (Without __render/__path)

You can also use primitives directly in React code. The Frame component supports both modes:

```tsx
// JSON-driven mode (requires __render and __path)
<WidgetRenderer spec={jsonSpec} />

// Direct React mode (no __render/__path needed)
<Frame className="custom-class">
  <Text value="Hello" />
  <Button label="Click me" />
</Frame>
```

The Frame component intelligently detects which mode it's in and handles rendering appropriately.

## Architecture

### Two-Layer System

1. **Atomic Layer**: Generic widget primitives (Frame, Row, Text, Button, etc.)
2. **Financial Layer**: Tool-specific widgets composed from primitives (PaymentSummary, InvoiceCard, etc.)

### Key Components

- **Primitives**: 16 atomic components (13 atoms + 3 patterns)
- **Renderer**: Validates and renders JSON widget specifications
- **Schemas**: Zod validators + JSON Schema definitions
- **Theme**: CSS custom properties for styling

## Getting Started

### Basic Usage

```tsx
import { WidgetRenderer } from '@/components/widgets/WidgetRenderer';

function MyComponent() {
  const widgetSpec = {
    type: 'Frame',
    size: 'md',
    padding: 'md',
    children: [
      {
        type: 'Text',
        value: 'Hello Widget!',
        size: 'lg',
        weight: 'semibold'
      }
    ]
  };

  return (
    <WidgetRenderer
      spec={widgetSpec}
      options={{
        onAction: (action, ctx) => {
          console.log('Action:', action);
        }
      }}
    />
  );
}
```

## Primitive Components

### Layout Primitives

#### Frame
Widget container - the default wrapper for all widgets.

```json
{
  "type": "Frame",
  "size": "md",           // "sm" | "md" | "lg" | "full"
  "padding": "md",        // "none" | "sm" | "md" | "lg"
  "children": []
}
```

#### FrameHeader
Header with title and optional expand icon.

```json
{
  "type": "FrameHeader",
  "title": "Payment Batch",
  "expandable": true
}
```

#### Row
Horizontal layout container.

```json
{
  "type": "Row",
  "align": "between",     // "start" | "center" | "end" | "between" | "stretch"
  "gap": "md",           // "none" | "sm" | "md" | "lg"
  "wrap": false,
  "children": []
}
```

#### Col
Vertical layout container.

```json
{
  "type": "Col",
  "gap": "md",
  "align": "start",
  "children": []
}
```

#### Spacer
Flexible space for layout adjustments.

```json
{
  "type": "Spacer",
  "grow": 1
}
```

#### Divider
Separator/rule for visual separation.

```json
{
  "type": "Divider",
  "orientation": "horizontal",  // "horizontal" | "vertical"
  "spacing": "md"
}
```

### Content Primitives

#### Text
Text display with size, weight, color, and semantic HTML support.

```json
{
  "type": "Text",
  "value": "Hello World",
  "size": "md",          // "xs" | "sm" | "md" | "lg" | "xl"
  "weight": "regular",   // "regular" | "medium" | "semibold" | "bold"
  "color": "default",    // "default" | "secondary" | "emphasis" | "muted" | "danger" | "success" | "warning"
  "emphasis": false,
  "truncate": false,
  "as": "span"          // "span" | "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
}
```

#### Icon
Icon display using lucide-react icons.

```json
{
  "type": "Icon",
  "name": "TrendingUp",   // lucide icon name
  "size": "md",
  "color": "default"
}
```

#### Avatar
User/entity avatar display.

```json
{
  "type": "Avatar",
  "src": "https://...",
  "fallback": "JD",
  "size": "md",           // "sm" | "md" | "lg"
  "shape": "circle"       // "circle" | "square"
}
```

#### Amount
Currency/number display with formatting.

```json
{
  "type": "Amount",
  "value": 150000,
  "currency": "NGN",
  "showCurrency": true,
  "size": "md",
  "weight": "regular",
  "color": "default"      // "default" | "success" | "danger" | "warning"
}
```

#### Time
Timestamp display with formatting options.

```json
{
  "type": "Time",
  "value": "2024-01-15T10:30:00Z",
  "format": "relative",   // "relative" | "absolute" | "time" | "date"
  "size": "sm",
  "color": "muted"
}
```

#### Badge
Status indicator badge.

```json
{
  "type": "Badge",
  "label": "Active",
  "variant": "success",   // "default" | "secondary" | "success" | "warning" | "danger" | "outline"
  "size": "sm"            // "sm" | "md"
}
```

### Interactive Primitives

#### Button
Action button with icon support.

```json
{
  "type": "Button",
  "label": "Approve",
  "variant": "default",   // "default" | "secondary" | "outline" | "ghost" | "destructive"
  "size": "md",           // "sm" | "md" | "lg"
  "fullWidth": false,
  "disabled": false,
  "icon": "Check",        // lucide icon name
  "iconPosition": "left", // "left" | "right"
  "onClickAction": {
    "type": "approve_tool",
    "toolCallId": "abc123"
  }
}
```

### Pattern Components

#### KeyValueRow
Single label-value pair display.

```json
{
  "type": "KeyValueRow",
  "label": "Total Amount",
  "value": { "type": "Amount", "value": 150000, "currency": "NGN" },
  "emphasis": false
}
```

#### KeyValueList
List of key-value rows with optional dividers.

```json
{
  "type": "KeyValueList",
  "items": [
    {
      "type": "KeyValueRow",
      "label": "Customer",
      "value": { "type": "Text", "value": "Acme Corp" }
    }
  ],
  "gap": "md",
  "dividers": false
}
```

#### ButtonGroup
Group of buttons with layout control.

```json
{
  "type": "ButtonGroup",
  "buttons": [
    { "type": "Button", "label": "Approve", "variant": "default" },
    { "type": "Button", "label": "Reject", "variant": "destructive" }
  ],
  "orientation": "horizontal",  // "horizontal" | "vertical"
  "gap": "md"
}
```

## Actions

Widgets can trigger actions through button clicks and other interactions:

```typescript
type Action =
  | { type: 'approve_tool'; toolCallId: string }
  | { type: 'reject_tool'; toolCallId: string }
  | { type: 'expand'; target?: 'fullscreen' | 'modal' }
  | { type: 'navigate'; to: string }
  | { type: 'share'; payload?: any }
  | { type: 'download'; payload?: any }
  | { type: 'emit'; event: string; payload?: any };
```

Handle actions in the renderer options:

```tsx
<WidgetRenderer
  spec={widgetSpec}
  options={{
    onAction: (action, ctx) => {
      switch (action.type) {
        case 'approve_tool':
          handleApproval(action.toolCallId);
          break;
        case 'expand':
          openFullscreen();
          break;
        // ... other actions
      }
    }
  }}
/>
```

## Financial Widget Examples

### Payment Summary Widget

```json
{
  "type": "Frame",
  "size": "md",
  "padding": "md",
  "children": [
    {
      "type": "FrameHeader",
      "title": "Payment Batch",
      "expandable": true
    },
    {
      "type": "Row",
      "align": "between",
      "children": [
        {
          "type": "Col",
          "gap": "sm",
          "children": [
            { "type": "Text", "value": "BATCH-2024-001", "size": "lg", "weight": "semibold" }
          ]
        },
        { "type": "Badge", "label": "Queued", "variant": "warning" }
      ]
    },
    { "type": "Divider", "spacing": "md" },
    {
      "type": "Row",
      "gap": "lg",
      "children": [
        {
          "type": "Col",
          "gap": "sm",
          "children": [
            { "type": "Text", "value": "Total Amount", "size": "xs", "color": "muted" },
            { "type": "Amount", "value": 150000, "currency": "NGN", "size": "md", "weight": "semibold" }
          ]
        },
        {
          "type": "Col",
          "gap": "sm",
          "children": [
            { "type": "Text", "value": "Recipients", "size": "xs", "color": "muted" },
            { "type": "Text", "value": "5", "size": "md", "weight": "semibold" }
          ]
        }
      ]
    }
  ]
}
```

### Virtual Card Widget

See `schema/financial/virtual-card.schema.json` for examples.

### Invoice Widget

See `schema/financial/invoice.schema.json` for examples.

## OpenAI Tool Integration

### Returning Widgets from Tools

In your tool execution function, include a `_widget` property:

```typescript
export const executeToolCall = async (toolName: string, args: any) => {
  switch (toolName) {
    case 'pay_contractors_bulk':
      return {
        status: 'queued',
        message: 'Payment queued successfully',
        // Widget specification
        _widget: {
          type: 'Frame',
          size: 'md',
          padding: 'md',
          children: [
            // ... widget JSON
          ]
        }
      };
  }
};
```

### Store Integration

Widgets are automatically extracted and stored:

```typescript
export interface ToolExecution {
  id: string;
  toolName: string;
  arguments: any;
  result: any;
  widget?: any; // Widget specification from result._widget
  timestamp: string;
  duration?: number;
}
```

### Rendering in UI

```tsx
{toolExecutions.map((execution) => (
  execution.widget && (
    <WidgetRenderer
      key={execution.id}
      spec={execution.widget}
      options={{
        onAction: (action, ctx) => {
          // Handle actions
        }
      }}
    />
  )
))}
```

## Theme Customization

Widget styling uses CSS custom properties defined in `theme/tokens.css`:

```css
:root {
  /* Layout */
  --widget-radius-sm: 0.25rem;
  --widget-space-2: 0.5rem;

  /* Typography */
  --widget-font-size-md: 1rem;
  --widget-font-weight-600: 600;

  /* Colors */
  --widget-fg-default: hsl(var(--foreground));
  --widget-fg-success: hsl(142 76% 36%);
  /* ... */
}
```

Override these variables in your app's CSS for custom styling.

## Validation

All widget specifications are validated using Zod before rendering:

```typescript
import { validateWidget, safeValidateWidget } from './schemas';

// Throws error if invalid
const validated = validateWidget(widgetSpec);

// Safe validation
const result = safeValidateWidget(widgetSpec);
if (result.success) {
  // Use result.data
} else {
  // Handle result.error
}
```

## Error Handling

The renderer displays validation errors inline:

```tsx
<WidgetRenderer spec={invalidSpec} />
// Renders error UI with details
```

For production, use `SafeWidgetRenderer`:

```tsx
import { SafeWidgetRenderer } from './WidgetRenderer';

<SafeWidgetRenderer spec={spec} />
// Never throws, always renders something
```

## Performance

- Widget validation happens once per tool execution
- Primitives are memoized React components
- Images default to `loading="lazy"`
- Target: < 16ms render time for typical financial widgets (60fps)

## Accessibility

- All primitives use shadcn/ui (built on Radix UI) for WCAG 2.1 Level AA compliance
- `Text` component supports semantic HTML via `as` prop
- `Button` uses native `<button>` with keyboard support
- Color contrast ratios meet WCAG AA standards (4.5:1 for text)
- `Divider` uses `role="separator"` when semantic

## Security

- No HTML injection - `Text.value` is plain text only
- No dynamic code execution or `eval`
- Widget JSON validated via Zod before render
- External images passed through unchanged (document CSP in your app)
- Action handlers require explicit user approval

## Best Practices

1. **Keep widgets declarative**: Define structure in JSON, not code
2. **Use pattern components**: `KeyValueList` instead of manual Row/Col nesting
3. **Validate early**: Use Zod schemas to catch errors before rendering
4. **Handle errors gracefully**: Show error UIs, don't crash
5. **Test with real data**: Use actual tool responses, not mocks
6. **Follow accessibility guidelines**: Use semantic HTML, provide alt text
7. **Monitor performance**: Keep render times < 16ms

## Troubleshooting

### Widget not rendering

- Check console for validation errors
- Ensure `type` field is present and correct
- Verify all required fields are provided
- Check that lucide icons exist for `Icon` components

### Styling issues

- Import `theme/tokens.css` in your app
- Check that CSS variables are defined
- Verify Tailwind config includes widget components

### Action handlers not firing

- Ensure `onAction` is provided in renderer options
- Check that `onClickAction` is set on buttons
- Verify action type is correct

## Examples

See `schema/financial/*.schema.json` for complete examples of each financial widget type.

## API Reference

### WidgetRenderer

```typescript
interface WidgetRendererProps {
  spec: unknown;              // JSON widget specification
  options?: RenderOptions;
}

interface RenderOptions {
  onAction?: (action: Action, ctx: { node: any; path: string }) => void;
  theme?: 'light' | 'dark';
}
```

### Base Widget Props

All primitives accept these base props:

```typescript
interface BaseWidgetProps {
  type: string;           // Required discriminator
  key?: string;           // Stable key for lists
  id?: string;            // DOM id
  testId?: string;        // Testing identifier
  visible?: boolean;      // Default true
  aria?: Record<string, string>;  // ARIA attributes
}
```

## Contributing

When adding new primitives:

1. Add TypeScript type to `types.ts`
2. Add Zod schema to `schemas.ts`
3. Add JSON Schema to `schema/primitives.schema.json`
4. Implement React component in `primitives/`
5. Register in `primitives/index.ts`
6. Add documentation to this README
7. Add tests to `__tests__/`

## License

See root LICENSE file.
