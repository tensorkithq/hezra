/**
 * Widget System Zod Schemas
 *
 * Runtime validation schemas for all widget primitives.
 */

import { z } from 'zod';

// Base schema for all widgets
const BaseSchema = z.object({
  type: z.string(),
  key: z.string().optional(),
  id: z.string().optional(),
  testId: z.string().optional(),
  visible: z.boolean().default(true),
  aria: z.record(z.string()).optional(),
});

// Action schemas
const ActionSchema: z.ZodType<any> = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('approve_tool'),
    toolCallId: z.string(),
  }),
  z.object({
    type: z.literal('reject_tool'),
    toolCallId: z.string(),
  }),
  z.object({
    type: z.literal('expand'),
    target: z.enum(['fullscreen', 'modal']).optional(),
  }),
  z.object({
    type: z.literal('navigate'),
    to: z.string(),
  }),
  z.object({
    type: z.literal('share'),
    payload: z.any().optional(),
  }),
  z.object({
    type: z.literal('download'),
    payload: z.any().optional(),
  }),
  z.object({
    type: z.literal('emit'),
    event: z.string(),
    payload: z.any().optional(),
  }),
]);

// Layout primitive schemas
const FrameSchema = BaseSchema.extend({
  type: z.literal('Frame'),
  size: z.enum(['sm', 'md', 'lg', 'full']).default('md'),
  padding: z.enum(['none', 'sm', 'md', 'lg']).default('md'),
  children: z.array(z.lazy(() => WidgetNodeSchema)).optional(),
});

const FrameHeaderSchema = BaseSchema.extend({
  type: z.literal('FrameHeader'),
  title: z.string(),
  expandable: z.boolean().default(true),
  actions: z.array(ActionSchema).optional(),
});

const RowSchema = BaseSchema.extend({
  type: z.literal('Row'),
  align: z.enum(['start', 'center', 'end', 'between', 'stretch']).default('start'),
  gap: z.enum(['none', 'sm', 'md', 'lg']).default('md'),
  wrap: z.boolean().default(false),
  children: z.array(z.lazy(() => WidgetNodeSchema)).optional(),
});

const ColSchema = BaseSchema.extend({
  type: z.literal('Col'),
  gap: z.enum(['none', 'sm', 'md', 'lg']).default('md'),
  align: z.enum(['start', 'center', 'end', 'stretch']).default('start'),
  children: z.array(z.lazy(() => WidgetNodeSchema)).optional(),
});

const SpacerSchema = BaseSchema.extend({
  type: z.literal('Spacer'),
  grow: z.number().default(1),
});

const DividerSchema = BaseSchema.extend({
  type: z.literal('Divider'),
  orientation: z.enum(['horizontal', 'vertical']).default('horizontal'),
  spacing: z.enum(['none', 'sm', 'md', 'lg']).default('md'),
});

// Content primitive schemas
const TextSchema = BaseSchema.extend({
  type: z.literal('Text'),
  value: z.string(),
  size: z.enum(['xs', 'sm', 'md', 'lg', 'xl']).default('md'),
  weight: z.enum(['regular', 'medium', 'semibold', 'bold']).default('regular'),
  color: z
    .enum(['default', 'secondary', 'emphasis', 'muted', 'danger', 'success', 'warning'])
    .default('default'),
  emphasis: z.boolean().default(false),
  truncate: z.boolean().default(false),
  as: z.enum(['span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']).default('span'),
});

const IconSchema = BaseSchema.extend({
  type: z.literal('Icon'),
  name: z.string(),
  size: z.enum(['xs', 'sm', 'md', 'lg']).default('md'),
  color: z
    .enum(['default', 'secondary', 'emphasis', 'muted', 'danger', 'success', 'warning'])
    .default('default'),
});

const AvatarSchema = BaseSchema.extend({
  type: z.literal('Avatar'),
  src: z.string().optional(),
  fallback: z.string().optional(),
  size: z.enum(['sm', 'md', 'lg']).default('md'),
  shape: z.enum(['circle', 'square']).default('circle'),
});

const AmountSchema = BaseSchema.extend({
  type: z.literal('Amount'),
  value: z.number(),
  currency: z.string().optional(),
  showCurrency: z.boolean().default(true),
  size: z.enum(['xs', 'sm', 'md', 'lg', 'xl']).default('md'),
  weight: z.enum(['regular', 'medium', 'semibold', 'bold']).default('regular'),
  color: z.enum(['default', 'success', 'danger', 'warning']).default('default'),
});

const TimeSchema = BaseSchema.extend({
  type: z.literal('Time'),
  value: z.string(),
  format: z.enum(['relative', 'absolute', 'time', 'date']).default('relative'),
  size: z.enum(['xs', 'sm', 'md']).default('sm'),
  color: z.enum(['default', 'secondary', 'muted']).default('muted'),
});

const BadgeSchema = BaseSchema.extend({
  type: z.literal('Badge'),
  label: z.string(),
  variant: z
    .enum(['default', 'secondary', 'success', 'warning', 'danger', 'outline'])
    .default('default'),
  size: z.enum(['sm', 'md']).default('sm'),
});

// Interactive primitive schemas
const ButtonSchema = BaseSchema.extend({
  type: z.literal('Button'),
  label: z.string(),
  variant: z
    .enum(['default', 'secondary', 'outline', 'ghost', 'destructive'])
    .default('default'),
  size: z.enum(['sm', 'md', 'lg']).default('md'),
  fullWidth: z.boolean().default(false),
  disabled: z.boolean().default(false),
  icon: z.string().optional(),
  iconPosition: z.enum(['left', 'right']).default('left'),
  onClickAction: ActionSchema.optional(),
});

// Pattern component schemas
const KeyValueRowSchema = BaseSchema.extend({
  type: z.literal('KeyValueRow'),
  label: z.string(),
  value: z.lazy(() => WidgetNodeSchema),
  emphasis: z.boolean().default(false),
});

const KeyValueListSchema = BaseSchema.extend({
  type: z.literal('KeyValueList'),
  items: z.array(KeyValueRowSchema),
  gap: z.enum(['none', 'sm', 'md', 'lg']).default('md'),
  dividers: z.boolean().default(false),
});

const ButtonGroupSchema = BaseSchema.extend({
  type: z.literal('ButtonGroup'),
  buttons: z.array(ButtonSchema),
  orientation: z.enum(['horizontal', 'vertical']).default('horizontal'),
  gap: z.enum(['sm', 'md', 'lg']).default('md'),
});

// Widget node discriminated union
const WidgetNodeSchema: z.ZodType<any> = z.discriminatedUnion('type', [
  FrameSchema,
  FrameHeaderSchema,
  RowSchema,
  ColSchema,
  SpacerSchema,
  DividerSchema,
  TextSchema,
  IconSchema,
  AvatarSchema,
  AmountSchema,
  TimeSchema,
  BadgeSchema,
  ButtonSchema,
  KeyValueRowSchema,
  KeyValueListSchema,
  ButtonGroupSchema,
]);

/**
 * Validates and parses a widget specification
 * @throws {z.ZodError} if validation fails
 */
export function validateWidget(spec: unknown): any {
  return WidgetNodeSchema.parse(spec);
}

/**
 * Safely validates a widget specification
 * @returns { success: true, data: WidgetNode } or { success: false, error: z.ZodError }
 */
export function safeValidateWidget(spec: unknown): z.SafeParseReturnType<any, any> {
  return WidgetNodeSchema.safeParse(spec);
}

// Export all schemas for testing and advanced use
export {
  BaseSchema,
  ActionSchema,
  FrameSchema,
  FrameHeaderSchema,
  RowSchema,
  ColSchema,
  SpacerSchema,
  DividerSchema,
  TextSchema,
  IconSchema,
  AvatarSchema,
  AmountSchema,
  TimeSchema,
  BadgeSchema,
  ButtonSchema,
  KeyValueRowSchema,
  KeyValueListSchema,
  ButtonGroupSchema,
  WidgetNodeSchema,
};
