/**
 * Widget System Type Definitions
 *
 * All widget primitives and their props for the JSON-driven widget system.
 */

// Base types for all widgets
export interface BaseWidgetProps {
  type: string;
  key?: string;
  id?: string;
  testId?: string;
  visible?: boolean;
  aria?: Record<string, string>;
}

// Internal props passed by renderer
export interface RendererProps {
  __path: string;
  __onAction: (action: Action, ctx: { node: any; path: string }) => void;
  __render: (node: WidgetNode, path?: string) => JSX.Element | null;
}

// Action types
export type Action =
  | { type: 'approve_tool'; toolCallId: string }
  | { type: 'reject_tool'; toolCallId: string }
  | { type: 'expand'; target?: 'fullscreen' | 'modal' }
  | { type: 'navigate'; to: string }
  | { type: 'share'; payload?: any }
  | { type: 'download'; payload?: any }
  | { type: 'emit'; event: string; payload?: any };

// Layout Primitives
export interface FrameProps extends BaseWidgetProps {
  type: 'Frame';
  size?: 'sm' | 'md' | 'lg' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children?: WidgetNode[];
}

export interface FrameHeaderProps extends BaseWidgetProps {
  type: 'FrameHeader';
  title: string;
  expandable?: boolean;
  actions?: Action[];
}

export interface RowProps extends BaseWidgetProps {
  type: 'Row';
  align?: 'start' | 'center' | 'end' | 'between' | 'stretch';
  gap?: 'none' | 'sm' | 'md' | 'lg';
  wrap?: boolean;
  children?: WidgetNode[];
}

export interface ColProps extends BaseWidgetProps {
  type: 'Col';
  gap?: 'none' | 'sm' | 'md' | 'lg';
  align?: 'start' | 'center' | 'end' | 'stretch';
  children?: WidgetNode[];
}

export interface SpacerProps extends BaseWidgetProps {
  type: 'Spacer';
  grow?: number;
}

export interface DividerProps extends BaseWidgetProps {
  type: 'Divider';
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
}

// Content Primitives
export interface TextProps extends BaseWidgetProps {
  type: 'Text';
  value: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  color?: 'default' | 'secondary' | 'emphasis' | 'muted' | 'danger' | 'success' | 'warning';
  emphasis?: boolean;
  truncate?: boolean;
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export interface IconProps extends BaseWidgetProps {
  type: 'Icon';
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: 'default' | 'secondary' | 'emphasis' | 'muted' | 'danger' | 'success' | 'warning';
}

export interface AvatarProps extends BaseWidgetProps {
  type: 'Avatar';
  src?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg';
  shape?: 'circle' | 'square';
}

export interface AmountProps extends BaseWidgetProps {
  type: 'Amount';
  value: number;
  currency?: string;
  showCurrency?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  color?: 'default' | 'success' | 'danger' | 'warning';
}

export interface TimeProps extends BaseWidgetProps {
  type: 'Time';
  value: string;
  format?: 'relative' | 'absolute' | 'time' | 'date';
  size?: 'xs' | 'sm' | 'md';
  color?: 'default' | 'secondary' | 'muted';
}

export interface BadgeProps extends BaseWidgetProps {
  type: 'Badge';
  label: string;
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';
  size?: 'sm' | 'md';
}

// Interactive Primitives
export interface ButtonProps extends BaseWidgetProps {
  type: 'Button';
  label: string;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  onClickAction?: Action;
}

// Pattern Components
export interface KeyValueRowProps extends BaseWidgetProps {
  type: 'KeyValueRow';
  label: string;
  value: WidgetNode;
  emphasis?: boolean;
}

export interface KeyValueListProps extends BaseWidgetProps {
  type: 'KeyValueList';
  items: KeyValueRowProps[];
  gap?: 'none' | 'sm' | 'md' | 'lg';
  dividers?: boolean;
}

export interface ButtonGroupProps extends BaseWidgetProps {
  type: 'ButtonGroup';
  buttons: ButtonProps[];
  orientation?: 'horizontal' | 'vertical';
  gap?: 'sm' | 'md' | 'lg';
}

// Union type of all widget nodes
export type WidgetNode =
  | FrameProps
  | FrameHeaderProps
  | RowProps
  | ColProps
  | SpacerProps
  | DividerProps
  | TextProps
  | IconProps
  | AvatarProps
  | AmountProps
  | TimeProps
  | BadgeProps
  | ButtonProps
  | KeyValueRowProps
  | KeyValueListProps
  | ButtonGroupProps;

// Widget renderer options
export interface RenderOptions {
  onAction?: (action: Action, ctx: { node: any; path: string }) => void;
  theme?: 'light' | 'dark';
}

// Widget renderer props
export interface WidgetRendererProps {
  spec: unknown;
  options?: RenderOptions;
}
