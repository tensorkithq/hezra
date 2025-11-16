/**
 * Sandbox Page
 *
 * Preview and test all widget primitives and financial widgets
 */

import { useState } from 'react';
import { WidgetRenderer } from '@/components/widgets/WidgetRenderer';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { WidgetNode } from '@/components/widgets/types';

// Category type
type WidgetCategory = 'primitives' | 'patterns' | 'financial';

// Widget example structure
interface WidgetExample {
  name: string;
  description: string;
  spec: WidgetNode;
  category: WidgetCategory;
}

// Example widget specifications organized by category
const widgetExamples: Record<string, WidgetExample> = {
  // ======================
  // PRIMITIVE COMPONENTS
  // ======================
  frame: {
    name: 'Frame',
    description: 'Container for widgets with different sizes and padding',
    category: 'primitives',
    spec: {
      type: 'Frame',
      size: 'md',
      padding: 'md',
      children: [
        {
          type: 'Text',
          value: 'This is a Frame container with medium size and padding',
          size: 'md',
        },
      ],
    },
  },
  frameheader: {
    name: 'FrameHeader',
    description: 'Header with title and optional expand icon',
    category: 'primitives',
    spec: {
      type: 'Frame',
      size: 'md',
      padding: 'md',
      children: [
        {
          type: 'FrameHeader',
          title: 'Payment Details',
          expandable: true,
        },
        {
          type: 'Text',
          value: 'Content goes here...',
          size: 'sm',
          color: 'muted',
        },
      ],
    },
  },
  text: {
    name: 'Text',
    description: 'Text component with various sizes, weights, and colors',
    category: 'primitives',
    spec: {
      type: 'Frame',
      size: 'md',
      padding: 'md',
      children: [
        { type: 'Text', value: 'Extra small text', size: 'xs' },
        { type: 'Text', value: 'Small text', size: 'sm' },
        { type: 'Text', value: 'Medium text', size: 'md' },
        { type: 'Text', value: 'Large text', size: 'lg' },
        { type: 'Text', value: 'Extra large text', size: 'xl' },
        { type: 'Divider', spacing: 'md' },
        { type: 'Text', value: 'Regular weight', weight: 'regular' },
        { type: 'Text', value: 'Medium weight', weight: 'medium' },
        { type: 'Text', value: 'Semibold weight', weight: 'semibold' },
        { type: 'Text', value: 'Bold weight', weight: 'bold' },
        { type: 'Divider', spacing: 'md' },
        { type: 'Text', value: 'Default color', color: 'default' },
        { type: 'Text', value: 'Secondary color', color: 'secondary' },
        { type: 'Text', value: 'Emphasis color', color: 'emphasis' },
        { type: 'Text', value: 'Muted color', color: 'muted' },
        { type: 'Text', value: 'Danger color', color: 'danger' },
        { type: 'Text', value: 'Success color', color: 'success' },
        { type: 'Text', value: 'Warning color', color: 'warning' },
      ],
    },
  },
  button: {
    name: 'Button',
    description: 'Interactive button with variants and sizes',
    category: 'primitives',
    spec: {
      type: 'Frame',
      size: 'md',
      padding: 'md',
      children: [
        { type: 'Text', value: 'Button Variants:', weight: 'semibold', size: 'md' },
        { type: 'Spacer', grow: 1 },
        {
          type: 'ButtonGroup',
          orientation: 'vertical',
          gap: 'sm',
          buttons: [
            { type: 'Button', label: 'Default Button', variant: 'default' },
            { type: 'Button', label: 'Secondary Button', variant: 'secondary' },
            { type: 'Button', label: 'Outline Button', variant: 'outline' },
            { type: 'Button', label: 'Ghost Button', variant: 'ghost' },
            { type: 'Button', label: 'Destructive Button', variant: 'destructive' },
          ],
        },
        { type: 'Divider', spacing: 'md' },
        { type: 'Text', value: 'Button Sizes:', weight: 'semibold', size: 'md' },
        { type: 'Spacer', grow: 1 },
        {
          type: 'Row',
          align: 'start',
          gap: 'sm',
          children: [
            { type: 'Button', label: 'Small', size: 'sm' },
            { type: 'Button', label: 'Medium', size: 'md' },
            { type: 'Button', label: 'Large', size: 'lg' },
          ],
        },
        { type: 'Divider', spacing: 'md' },
        { type: 'Text', value: 'With Icons:', weight: 'semibold', size: 'md' },
        { type: 'Spacer', grow: 1 },
        {
          type: 'Row',
          align: 'start',
          gap: 'sm',
          children: [
            { type: 'Button', label: 'Left Icon', icon: 'arrow-left', iconPosition: 'left' },
            { type: 'Button', label: 'Right Icon', icon: 'arrow-right', iconPosition: 'right' },
          ],
        },
      ],
    },
  },
  row: {
    name: 'Row',
    description: 'Horizontal layout container with alignment options',
    category: 'primitives',
    spec: {
      type: 'Frame',
      size: 'md',
      padding: 'md',
      children: [
        { type: 'Text', value: 'Row with start alignment:', weight: 'semibold', size: 'sm' },
        {
          type: 'Row',
          align: 'start',
          gap: 'md',
          children: [
            { type: 'Badge', label: 'Item 1', variant: 'default' },
            { type: 'Badge', label: 'Item 2', variant: 'secondary' },
            { type: 'Badge', label: 'Item 3', variant: 'success' },
          ],
        },
        { type: 'Divider', spacing: 'md' },
        { type: 'Text', value: 'Row with between alignment:', weight: 'semibold', size: 'sm' },
        {
          type: 'Row',
          align: 'between',
          gap: 'md',
          children: [
            { type: 'Text', value: 'Left', size: 'sm' },
            { type: 'Text', value: 'Right', size: 'sm' },
          ],
        },
      ],
    },
  },
  col: {
    name: 'Col',
    description: 'Vertical layout container (Column)',
    category: 'primitives',
    spec: {
      type: 'Frame',
      size: 'md',
      padding: 'md',
      children: [
        { type: 'Text', value: 'Column Layout:', weight: 'semibold' },
        { type: 'Spacer', grow: 1 },
        {
          type: 'Col',
          gap: 'sm',
          align: 'start',
          children: [
            { type: 'Text', value: 'First item', size: 'sm' },
            { type: 'Text', value: 'Second item', size: 'sm' },
            { type: 'Text', value: 'Third item', size: 'sm' },
          ],
        },
      ],
    },
  },
  spacer: {
    name: 'Spacer',
    description: 'Flexible space for layout adjustments',
    category: 'primitives',
    spec: {
      type: 'Frame',
      size: 'md',
      padding: 'md',
      children: [
        {
          type: 'Row',
          align: 'start',
          children: [
            { type: 'Text', value: 'Left', size: 'sm' },
            { type: 'Spacer', grow: 1 },
            { type: 'Text', value: 'Right (pushed by spacer)', size: 'sm' },
          ],
        },
      ],
    },
  },
  divider: {
    name: 'Divider',
    description: 'Separator line for visual separation',
    category: 'primitives',
    spec: {
      type: 'Frame',
      size: 'md',
      padding: 'md',
      children: [
        { type: 'Text', value: 'Section 1', size: 'sm' },
        { type: 'Divider', spacing: 'md', orientation: 'horizontal' },
        { type: 'Text', value: 'Section 2', size: 'sm' },
      ],
    },
  },
  badge: {
    name: 'Badge',
    description: 'Status badges with different variants',
    category: 'primitives',
    spec: {
      type: 'Frame',
      size: 'md',
      padding: 'md',
      children: [
        { type: 'Text', value: 'Badge Variants:', weight: 'semibold', size: 'md' },
        { type: 'Spacer', grow: 1 },
        {
          type: 'Row',
          align: 'start',
          gap: 'sm',
          wrap: true,
          children: [
            { type: 'Badge', label: 'Default', variant: 'default' },
            { type: 'Badge', label: 'Secondary', variant: 'secondary' },
            { type: 'Badge', label: 'Success', variant: 'success' },
            { type: 'Badge', label: 'Warning', variant: 'warning' },
            { type: 'Badge', label: 'Danger', variant: 'danger' },
            { type: 'Badge', label: 'Outline', variant: 'outline' },
          ],
        },
        { type: 'Divider', spacing: 'md' },
        { type: 'Text', value: 'Badge Sizes:', weight: 'semibold', size: 'md' },
        { type: 'Spacer', grow: 1 },
        {
          type: 'Row',
          align: 'start',
          gap: 'sm',
          children: [
            { type: 'Badge', label: 'Small', size: 'sm', variant: 'default' },
            { type: 'Badge', label: 'Medium', size: 'md', variant: 'default' },
          ],
        },
      ],
    },
  },
  icon: {
    name: 'Icon',
    description: 'Icon primitives with different sizes and colors',
    category: 'primitives',
    spec: {
      type: 'Frame',
      size: 'md',
      padding: 'md',
      children: [
        { type: 'Text', value: 'Icon Sizes:', weight: 'semibold', size: 'md' },
        { type: 'Spacer', grow: 1 },
        {
          type: 'Row',
          align: 'start',
          gap: 'md',
          children: [
            { type: 'Icon', name: 'check-circle', size: 'xs' },
            { type: 'Icon', name: 'check-circle', size: 'sm' },
            { type: 'Icon', name: 'check-circle', size: 'md' },
            { type: 'Icon', name: 'check-circle', size: 'lg' },
          ],
        },
        { type: 'Divider', spacing: 'md' },
        { type: 'Text', value: 'Icon Colors:', weight: 'semibold', size: 'md' },
        { type: 'Spacer', grow: 1 },
        {
          type: 'Row',
          align: 'start',
          gap: 'md',
          children: [
            { type: 'Icon', name: 'star', color: 'default' },
            { type: 'Icon', name: 'star', color: 'success' },
            { type: 'Icon', name: 'star', color: 'warning' },
            { type: 'Icon', name: 'star', color: 'danger' },
          ],
        },
      ],
    },
  },
  avatar: {
    name: 'Avatar',
    description: 'User avatars with fallbacks',
    category: 'primitives',
    spec: {
      type: 'Frame',
      size: 'md',
      padding: 'md',
      children: [
        { type: 'Text', value: 'Avatar Sizes:', weight: 'semibold', size: 'md' },
        { type: 'Spacer', grow: 1 },
        {
          type: 'Row',
          align: 'start',
          gap: 'md',
          children: [
            { type: 'Avatar', fallback: 'JD', size: 'sm' },
            { type: 'Avatar', fallback: 'JD', size: 'md' },
            { type: 'Avatar', fallback: 'JD', size: 'lg' },
          ],
        },
        { type: 'Divider', spacing: 'md' },
        { type: 'Text', value: 'Avatar Shapes:', weight: 'semibold', size: 'md' },
        { type: 'Spacer', grow: 1 },
        {
          type: 'Row',
          align: 'start',
          gap: 'md',
          children: [
            { type: 'Avatar', fallback: 'AB', shape: 'circle' },
            { type: 'Avatar', fallback: 'CD', shape: 'square' },
          ],
        },
      ],
    },
  },
  amount: {
    name: 'Amount',
    description: 'Currency amount display',
    category: 'primitives',
    spec: {
      type: 'Frame',
      size: 'md',
      padding: 'md',
      children: [
        { type: 'Text', value: 'Amount Sizes:', weight: 'semibold', size: 'md' },
        { type: 'Spacer', grow: 1 },
        {
          type: 'Col',
          gap: 'sm',
          children: [
            { type: 'Amount', value: 10000, currency: 'NGN', showCurrency: true, size: 'xs' },
            { type: 'Amount', value: 10000, currency: 'NGN', showCurrency: true, size: 'sm' },
            { type: 'Amount', value: 10000, currency: 'NGN', showCurrency: true, size: 'md' },
            { type: 'Amount', value: 10000, currency: 'NGN', showCurrency: true, size: 'lg' },
            { type: 'Amount', value: 10000, currency: 'NGN', showCurrency: true, size: 'xl' },
          ],
        },
        { type: 'Divider', spacing: 'md' },
        { type: 'Text', value: 'Amount Colors:', weight: 'semibold', size: 'md' },
        { type: 'Spacer', grow: 1 },
        {
          type: 'Col',
          gap: 'sm',
          children: [
            { type: 'Amount', value: 5000, currency: 'USD', showCurrency: true, color: 'default' },
            { type: 'Amount', value: 5000, currency: 'USD', showCurrency: true, color: 'success' },
            { type: 'Amount', value: -5000, currency: 'USD', showCurrency: true, color: 'danger' },
            { type: 'Amount', value: 5000, currency: 'USD', showCurrency: true, color: 'warning' },
          ],
        },
      ],
    },
  },
  time: {
    name: 'Time',
    description: 'Date and time formatting',
    category: 'primitives',
    spec: {
      type: 'Frame',
      size: 'md',
      padding: 'md',
      children: [
        { type: 'Text', value: 'Time Formats:', weight: 'semibold', size: 'md' },
        { type: 'Spacer', grow: 1 },
        {
          type: 'Col',
          gap: 'sm',
          children: [
            {
              type: 'Row',
              align: 'between',
              children: [
                { type: 'Text', value: 'Relative:', size: 'sm', color: 'muted' },
                { type: 'Time', value: new Date().toISOString(), format: 'relative' },
              ],
            },
            {
              type: 'Row',
              align: 'between',
              children: [
                { type: 'Text', value: 'Absolute:', size: 'sm', color: 'muted' },
                { type: 'Time', value: new Date().toISOString(), format: 'absolute' },
              ],
            },
            {
              type: 'Row',
              align: 'between',
              children: [
                { type: 'Text', value: 'Date only:', size: 'sm', color: 'muted' },
                { type: 'Time', value: new Date().toISOString(), format: 'date' },
              ],
            },
            {
              type: 'Row',
              align: 'between',
              children: [
                { type: 'Text', value: 'Time only:', size: 'sm', color: 'muted' },
                { type: 'Time', value: new Date().toISOString(), format: 'time' },
              ],
            },
          ],
        },
      ],
    },
  },

  // ======================
  // PATTERN COMPONENTS
  // ======================
  keyvalue: {
    name: 'KeyValueRow',
    description: 'Single key-value pair display',
    category: 'patterns',
    spec: {
      type: 'Frame',
      size: 'md',
      padding: 'md',
      children: [
        {
          type: 'KeyValueRow',
          label: 'Customer Name',
          value: { type: 'Text', value: 'John Doe', weight: 'medium' },
        },
        {
          type: 'KeyValueRow',
          label: 'Email Address',
          value: { type: 'Text', value: 'john@example.com', color: 'secondary' },
        },
        {
          type: 'KeyValueRow',
          label: 'Total Amount',
          value: { type: 'Amount', value: 25000, currency: 'NGN', showCurrency: true },
          emphasis: true,
        },
      ],
    },
  },
  keyvaluelist: {
    name: 'KeyValueList',
    description: 'List of key-value pairs with optional dividers',
    category: 'patterns',
    spec: {
      type: 'Frame',
      size: 'md',
      padding: 'md',
      children: [
        {
          type: 'KeyValueList',
          dividers: true,
          gap: 'sm',
          items: [
            {
              type: 'KeyValueRow',
              label: 'Customer',
              value: { type: 'Text', value: 'John Doe', weight: 'medium' },
            },
            {
              type: 'KeyValueRow',
              label: 'Email',
              value: { type: 'Text', value: 'john@example.com', color: 'secondary' },
            },
            {
              type: 'KeyValueRow',
              label: 'Status',
              value: { type: 'Badge', label: 'Active', variant: 'success' },
            },
            {
              type: 'KeyValueRow',
              label: 'Amount',
              value: { type: 'Amount', value: 25000, currency: 'NGN', showCurrency: true },
              emphasis: true,
            },
          ],
        },
      ],
    },
  },
  buttongroup: {
    name: 'ButtonGroup',
    description: 'Group of buttons with layout control',
    category: 'patterns',
    spec: {
      type: 'Frame',
      size: 'md',
      padding: 'md',
      children: [
        { type: 'Text', value: 'Horizontal ButtonGroup:', weight: 'semibold', size: 'sm' },
        { type: 'Spacer', grow: 1 },
        {
          type: 'ButtonGroup',
          orientation: 'horizontal',
          gap: 'sm',
          buttons: [
            { type: 'Button', label: 'Approve', variant: 'default' },
            { type: 'Button', label: 'Reject', variant: 'destructive' },
          ],
        },
        { type: 'Divider', spacing: 'md' },
        { type: 'Text', value: 'Vertical ButtonGroup:', weight: 'semibold', size: 'sm' },
        { type: 'Spacer', grow: 1 },
        {
          type: 'ButtonGroup',
          orientation: 'vertical',
          gap: 'sm',
          buttons: [
            { type: 'Button', label: 'View Details', variant: 'default', fullWidth: true },
            { type: 'Button', label: 'Download Receipt', variant: 'outline', fullWidth: true },
            { type: 'Button', label: 'Share', variant: 'ghost', fullWidth: true },
          ],
        },
      ],
    },
  },

  // ======================
  // FINANCIAL WIDGETS
  // ======================
  paymentSummary: {
    name: 'Payment Summary',
    description: 'Payment batch summary widget from schema',
    category: 'financial',
    spec: {
      type: 'Frame',
      size: 'md',
      padding: 'md',
      children: [
        {
          type: 'FrameHeader',
          title: 'Payment Batch',
          expandable: true,
        },
        {
          type: 'Row',
          align: 'between',
          children: [
            {
              type: 'Col',
              gap: 'sm',
              children: [
                { type: 'Text', value: 'BATCH-2024-001', size: 'lg', weight: 'semibold' },
              ],
            },
            {
              type: 'Badge',
              label: 'Queued',
              variant: 'warning',
            },
          ],
        },
        { type: 'Divider', spacing: 'md' },
        {
          type: 'Row',
          gap: 'lg',
          children: [
            {
              type: 'Col',
              gap: 'sm',
              children: [
                { type: 'Text', value: 'Total Amount', size: 'xs', color: 'muted' },
                { type: 'Amount', value: 150000, currency: 'NGN', size: 'md', weight: 'semibold' },
              ],
            },
            {
              type: 'Col',
              gap: 'sm',
              children: [
                { type: 'Text', value: 'Recipients', size: 'xs', color: 'muted' },
                { type: 'Text', value: '5', size: 'md', weight: 'semibold' },
              ],
            },
          ],
        },
      ],
    },
  },
  virtualCard: {
    name: 'Virtual Card',
    description: 'Virtual card details widget from schema',
    category: 'financial',
    spec: {
      type: 'Frame',
      size: 'md',
      padding: 'lg',
      children: [
        {
          type: 'FrameHeader',
          title: 'Virtual Card',
          expandable: true,
        },
        {
          type: 'Row',
          align: 'between',
          children: [
            { type: 'Text', value: 'Marketing Ads', size: 'lg', weight: 'semibold' },
            { type: 'Badge', label: 'Active', variant: 'success' },
          ],
        },
        { type: 'Divider', spacing: 'md' },
        {
          type: 'Col',
          gap: 'md',
          children: [
            {
              type: 'Row',
              gap: 'md',
              children: [
                { type: 'Text', value: '****', size: 'xl', weight: 'bold' },
                { type: 'Text', value: '****', size: 'xl', weight: 'bold' },
                { type: 'Text', value: '****', size: 'xl', weight: 'bold' },
                { type: 'Text', value: '4532', size: 'xl', weight: 'bold' },
              ],
            },
            {
              type: 'KeyValueList',
              gap: 'md',
              items: [
                {
                  type: 'KeyValueRow',
                  label: 'Spend Limit',
                  value: { type: 'Amount', value: 5000, currency: 'USD', size: 'sm' },
                },
                {
                  type: 'KeyValueRow',
                  label: 'Network',
                  value: { type: 'Text', value: 'VISA', weight: 'medium' },
                },
              ],
            },
          ],
        },
      ],
    },
  },
  invoice: {
    name: 'Invoice',
    description: 'Invoice details widget from schema',
    category: 'financial',
    spec: {
      type: 'Frame',
      size: 'md',
      padding: 'md',
      children: [
        {
          type: 'FrameHeader',
          title: 'Invoice',
          expandable: true,
        },
        {
          type: 'Row',
          align: 'between',
          children: [
            { type: 'Text', value: 'INV-2024-001', size: 'lg', weight: 'semibold' },
            { type: 'Badge', label: 'Sent', variant: 'default' },
          ],
        },
        { type: 'Divider', spacing: 'md' },
        {
          type: 'KeyValueList',
          gap: 'md',
          dividers: true,
          items: [
            {
              type: 'KeyValueRow',
              label: 'Customer',
              value: { type: 'Text', value: 'Acme Corp', weight: 'medium' },
            },
            {
              type: 'KeyValueRow',
              label: 'Amount Due',
              value: { type: 'Amount', value: 250000, currency: 'NGN', size: 'md', weight: 'semibold' },
              emphasis: true,
            },
            {
              type: 'KeyValueRow',
              label: 'Due Date',
              value: { type: 'Text', value: '2024-12-31', color: 'muted' },
            },
          ],
        },
        { type: 'Divider', spacing: 'md' },
        {
          type: 'ButtonGroup',
          orientation: 'horizontal',
          gap: 'md',
          buttons: [
            {
              type: 'Button',
              label: 'View Invoice',
              variant: 'default',
              icon: 'ExternalLink',
              iconPosition: 'right',
            },
          ],
        },
      ],
    },
  },
  accountSnapshot: {
    name: 'Account Snapshot',
    description: 'Account balance and KPIs widget from schema',
    category: 'financial',
    spec: {
      type: 'Frame',
      size: 'lg',
      padding: 'lg',
      children: [
        {
          type: 'FrameHeader',
          title: 'Account Overview',
          expandable: true,
        },
        {
          type: 'Col',
          gap: 'lg',
          children: [
            {
              type: 'Col',
              gap: 'sm',
              align: 'center',
              children: [
                { type: 'Text', value: 'Available Balance', size: 'sm', color: 'muted' },
                { type: 'Amount', value: 720000, currency: 'NGN', size: 'xl', weight: 'bold', color: 'default' },
              ],
            },
            { type: 'Divider', spacing: 'lg' },
            {
              type: 'Row',
              gap: 'lg',
              children: [
                {
                  type: 'Col',
                  gap: 'sm',
                  children: [
                    { type: 'Text', value: 'Transfers', size: 'xs', color: 'muted' },
                    { type: 'Text', value: '14', size: 'lg', weight: 'semibold' },
                    { type: 'Amount', value: 155000, currency: 'NGN', size: 'sm', showCurrency: false },
                  ],
                },
                {
                  type: 'Col',
                  gap: 'sm',
                  children: [
                    { type: 'Text', value: 'Invoices Paid', size: 'xs', color: 'muted' },
                    { type: 'Text', value: '3/5', size: 'lg', weight: 'semibold' },
                    { type: 'Amount', value: 610000, currency: 'NGN', size: 'sm', showCurrency: false },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  },
  transactionAggregate: {
    name: 'Transaction Analytics',
    description: 'Transaction aggregates and analytics widget from schema',
    category: 'financial',
    spec: {
      type: 'Frame',
      size: 'md',
      padding: 'md',
      children: [
        {
          type: 'FrameHeader',
          title: 'Transaction Analytics',
          expandable: true,
        },
        {
          type: 'Col',
          gap: 'md',
          children: [
            {
              type: 'Row',
              align: 'center',
              gap: 'sm',
              children: [
                { type: 'Icon', name: 'TrendingUp', size: 'md', color: 'success' },
                { type: 'Text', value: 'Top Categories', size: 'lg', weight: 'semibold' },
              ],
            },
            { type: 'Divider', spacing: 'md' },
            {
              type: 'KeyValueList',
              gap: 'md',
              dividers: true,
              items: [
                {
                  type: 'KeyValueRow',
                  label: 'Family Transfers',
                  value: { type: 'Amount', value: 42500, currency: 'NGN', size: 'sm', weight: 'medium' },
                },
                {
                  type: 'KeyValueRow',
                  label: 'Food',
                  value: { type: 'Amount', value: 18000, currency: 'NGN', size: 'sm', weight: 'medium' },
                },
                {
                  type: 'KeyValueRow',
                  label: 'Transport',
                  value: { type: 'Amount', value: 9000, currency: 'NGN', size: 'sm', weight: 'medium' },
                },
              ],
            },
            { type: 'Divider', spacing: 'md' },
            {
              type: 'Row',
              align: 'between',
              children: [
                { type: 'Text', value: 'Total', size: 'sm', weight: 'semibold' },
                { type: 'Amount', value: 69500, currency: 'NGN', size: 'md', weight: 'bold', color: 'default' },
              ],
            },
          ],
        },
      ],
    },
  },
  limit: {
    name: 'Transfer Limit',
    description: 'Account or beneficiary limits widget from schema',
    category: 'financial',
    spec: {
      type: 'Frame',
      size: 'md',
      padding: 'md',
      children: [
        {
          type: 'FrameHeader',
          title: 'Transfer Limit',
          expandable: true,
        },
        {
          type: 'Col',
          gap: 'md',
          children: [
            {
              type: 'Row',
              align: 'between',
              children: [
                { type: 'Text', value: 'Daily Limit', size: 'md', weight: 'medium' },
                { type: 'Badge', label: 'Active', variant: 'success' },
              ],
            },
            {
              type: 'KeyValueList',
              gap: 'md',
              dividers: true,
              items: [
                {
                  type: 'KeyValueRow',
                  label: 'Limit Amount',
                  value: { type: 'Amount', value: 500000, currency: 'NGN', size: 'md', weight: 'semibold' },
                  emphasis: true,
                },
                {
                  type: 'KeyValueRow',
                  label: 'Current Usage',
                  value: { type: 'Amount', value: 150000, currency: 'NGN', size: 'sm' },
                },
                {
                  type: 'KeyValueRow',
                  label: 'Remaining',
                  value: { type: 'Amount', value: 350000, currency: 'NGN', size: 'sm', color: 'success' },
                },
              ],
            },
          ],
        },
      ],
    },
  },
  transaction: {
    name: 'Transaction Card',
    description: 'Complete transaction widget example',
    category: 'financial',
    spec: {
      type: 'Frame',
      size: 'md',
      padding: 'md',
      children: [
        {
          type: 'FrameHeader',
          title: 'Transaction Details',
          expandable: true,
        },
        {
          type: 'Row',
          align: 'between',
          gap: 'md',
          children: [
            {
              type: 'Row',
              align: 'start',
              gap: 'md',
              children: [
                { type: 'Avatar', fallback: 'JD', size: 'md' },
                {
                  type: 'Col',
                  gap: 'none',
                  children: [
                    { type: 'Text', value: 'John Doe', weight: 'semibold', size: 'md' },
                    { type: 'Text', value: 'john@example.com', color: 'muted', size: 'sm' },
                  ],
                },
              ],
            },
            { type: 'Badge', label: 'Success', variant: 'success' },
          ],
        },
        { type: 'Divider', spacing: 'md' },
        {
          type: 'KeyValueList',
          gap: 'sm',
          items: [
            {
              type: 'KeyValueRow',
              label: 'Reference',
              value: { type: 'Text', value: 'TRX-12345678', size: 'sm', color: 'secondary' },
            },
            {
              type: 'KeyValueRow',
              label: 'Date',
              value: { type: 'Time', value: new Date().toISOString(), format: 'absolute' },
            },
            {
              type: 'KeyValueRow',
              label: 'Amount',
              value: {
                type: 'Amount',
                value: 50000,
                currency: 'NGN',
                showCurrency: true,
                color: 'success',
                weight: 'semibold',
              },
              emphasis: true,
            },
          ],
        },
        { type: 'Divider', spacing: 'md' },
        {
          type: 'ButtonGroup',
          orientation: 'horizontal',
          gap: 'sm',
          buttons: [
            { type: 'Button', label: 'View Receipt', variant: 'default', fullWidth: true },
            { type: 'Button', label: 'Refund', variant: 'outline', fullWidth: true },
          ],
        },
      ],
    },
  },
};

// Get categories and their widgets
const categories: Record<WidgetCategory, { label: string; description: string }> = {
  primitives: {
    label: 'Primitives',
    description: 'Basic atomic widget components',
  },
  patterns: {
    label: 'Patterns',
    description: 'Composite widget patterns',
  },
  financial: {
    label: 'Financial',
    description: 'Real-world financial widgets',
  },
};

export default function Sandbox() {
  const [selectedCategory, setSelectedCategory] = useState<WidgetCategory>('primitives');
  const [selectedWidget, setSelectedWidget] = useState('frame');

  const handleAction = (action: any, ctx: any) => {
    console.log('Widget action:', action, ctx);
  };

  // Get widgets for the selected category
  const categoryWidgets = Object.entries(widgetExamples).filter(
    ([_, example]) => example.category === selectedCategory
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Widget Sandbox</h1>
          <p className="text-muted-foreground">
            Preview and test all {Object.keys(widgetExamples).length} available widget components
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Widget Selector */}
          <div className="lg:col-span-1 space-y-4">
            {/* Category Selector */}
            <Card className="p-4">
              <h2 className="font-semibold mb-3">Categories</h2>
              <div className="flex flex-col gap-2">
                {Object.entries(categories).map(([key, cat]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedCategory(key as WidgetCategory);
                      // Select first widget in new category
                      const firstWidget = Object.entries(widgetExamples).find(
                        ([_, ex]) => ex.category === key
                      );
                      if (firstWidget) {
                        setSelectedWidget(firstWidget[0]);
                      }
                    }}
                    className={`p-3 rounded-lg text-left transition-colors ${
                      selectedCategory === key
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    <div className="font-medium">{cat.label}</div>
                    <div className="text-xs opacity-80">{cat.description}</div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Widget List */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">Widgets</h2>
                <Badge variant="secondary">{categoryWidgets.length}</Badge>
              </div>
              <ScrollArea className="h-[500px] pr-4">
                <Tabs
                  orientation="vertical"
                  value={selectedWidget}
                  onValueChange={setSelectedWidget}
                  className="w-full"
                >
                  <TabsList className="flex flex-col h-auto w-full bg-transparent gap-1">
                    {categoryWidgets.map(([key, example]) => (
                      <TabsTrigger
                        key={key}
                        value={key}
                        className="w-full justify-start data-[state=active]:bg-accent"
                      >
                        <div className="text-left">
                          <div className="font-medium">{example.name}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {example.description}
                          </div>
                        </div>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </ScrollArea>
            </Card>
          </div>

          {/* Widget Preview */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-2xl font-semibold">
                    {widgetExamples[selectedWidget]?.name || 'Unknown Widget'}
                  </h2>
                  <Badge variant="outline">
                    {widgetExamples[selectedWidget]?.category || 'unknown'}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  {widgetExamples[selectedWidget]?.description || 'No description available'}
                </p>
              </div>

              <div className="border rounded-lg p-6 bg-muted/50 flex justify-center items-start min-h-[300px]">
                {widgetExamples[selectedWidget] ? (
                  <WidgetRenderer
                    spec={widgetExamples[selectedWidget].spec}
                    options={{ onAction: handleAction }}
                  />
                ) : (
                  <div className="text-muted-foreground">Select a widget to preview</div>
                )}
              </div>
            </Card>

            {/* JSON Spec */}
            <Card className="p-6">
              <h3 className="font-semibold mb-3">Widget Specification (JSON)</h3>
              <ScrollArea className="h-[400px]">
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                  {widgetExamples[selectedWidget]
                    ? JSON.stringify(widgetExamples[selectedWidget].spec, null, 2)
                    : 'No specification available'}
                </pre>
              </ScrollArea>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
