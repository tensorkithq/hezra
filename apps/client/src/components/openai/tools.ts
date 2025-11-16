import { z } from 'zod';

// Tool configurations in OpenAI format
export const toolsConfig = [
  {
    type: 'function' as const,
    name: 'pay_contractors_bulk',
    description: 'Bulk pay multiple contractors in one batch transaction. Tell the user you are processing the payment.',
    parameters: {
      type: 'object',
      required: ['batch_reference', 'currency', 'items'],
      properties: {
        batch_reference: { type: 'string', description: 'Unique batch reference ID' },
        currency: { type: 'string', enum: ['NGN', 'GHS', 'KES', 'USD', 'ZAR'] },
        narration: { type: 'string' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            required: ['amount', 'bank_code', 'account_number', 'beneficiary_name'],
            properties: {
              amount: { type: 'number' },
              bank_code: { type: 'string' },
              account_number: { type: 'string' },
              beneficiary_name: { type: 'string' },
              reference: { type: 'string' },
              narration: { type: 'string' }
            }
          }
        }
      }
    }
  },
  {
    type: 'function' as const,
    name: 'set_account_limits',
    description: 'Set global balance and transfer limits for the user account',
    parameters: {
      type: 'object',
      properties: {
        balance_limit: { type: 'number', description: 'Maximum wallet balance alert threshold' },
        daily_transfer_limit: { type: 'number' },
        monthly_transfer_limit: { type: 'number' },
        currency: { type: 'string', enum: ['NGN', 'GHS', 'KES', 'USD', 'ZAR'], default: 'NGN' }
      }
    }
  },
  {
    type: 'function' as const,
    name: 'set_beneficiary_transfer_limit',
    description: 'Set per-beneficiary transfer limit policy with optional alerts',
    parameters: {
      type: 'object',
      required: ['beneficiary_id', 'period', 'amount_limit'],
      properties: {
        beneficiary_id: { type: 'string', description: 'Beneficiary identifier or name' },
        period: { type: 'string', enum: ['daily', 'weekly', 'monthly'] },
        amount_limit: { type: 'number' },
        currency: { type: 'string', enum: ['NGN', 'GHS', 'KES', 'USD', 'ZAR'], default: 'NGN' },
        alerts_at_percent: { type: 'number', description: 'Alert when this percentage of limit is reached', default: 80 }
      }
    }
  },
  {
    type: 'function' as const,
    name: 'create_virtual_card',
    description: 'Create a scoped virtual debit card with spending controls and optional expiration',
    parameters: {
      type: 'object',
      required: ['label', 'currency'],
      properties: {
        label: { type: 'string', description: 'Card label/name for identification' },
        currency: { type: 'string', enum: ['NGN', 'USD', 'EUR', 'GBP'] },
        spend_limit: { type: 'number', description: 'Maximum spending limit' },
        spend_period: { type: 'string', enum: ['per_transaction', 'daily', 'monthly', 'lifetime'], default: 'lifetime' },
        expires_at: { type: 'string', description: 'Card expiration date (ISO datetime)' }
      }
    }
  },
  {
    type: 'function' as const,
    name: 'send_invoice',
    description: 'Create and send an invoice to a customer via email or other channels',
    parameters: {
      type: 'object',
      required: ['invoice_number', 'customer', 'line_items', 'currency'],
      properties: {
        invoice_number: { type: 'string' },
        customer: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' }
          }
        },
        line_items: {
          type: 'array',
          items: {
            type: 'object',
            required: ['description', 'amount'],
            properties: {
              description: { type: 'string' },
              amount: { type: 'number' },
              quantity: { type: 'number', default: 1 }
            }
          }
        },
        currency: { type: 'string', enum: ['NGN', 'GHS', 'KES', 'USD'] },
        due_date: { type: 'string', description: 'Due date in YYYY-MM-DD format' },
        notes: { type: 'string' }
      }
    }
  },
  {
    type: 'function' as const,
    name: 'aggregate_transactions',
    description: 'Compute transaction and invoice aggregates over a time period with optional filters',
    parameters: {
      type: 'object',
      required: ['metric', 'from', 'to'],
      properties: {
        metric: {
          type: 'string',
          enum: ['total_transfers_value', 'total_transfers_count', 'total_transactions_value', 'total_transactions_count', 'total_invoices_value', 'total_invoices_count', 'top_categories']
        },
        from: { type: 'string', description: 'Start date/time (ISO datetime)' },
        to: { type: 'string', description: 'End date/time (ISO datetime)' },
        currency: { type: 'string', enum: ['NGN', 'GHS', 'KES', 'USD', 'ZAR'], default: 'NGN' },
        filters: {
          type: 'object',
          properties: {
            beneficiary_id: { type: 'string' },
            category: { type: 'string' }
          }
        }
      }
    }
  },
  {
    type: 'function' as const,
    name: 'account_snapshot',
    description: 'Get a summary of account balances and key KPIs for a time window',
    parameters: {
      type: 'object',
      properties: {
        scope: { type: 'string', enum: ['all', 'beneficiary', 'group'], default: 'all' },
        beneficiary_id: { type: 'string' },
        group: { type: 'string' },
        window: { type: 'string', enum: ['this_week', 'this_month', 'last_month', 'this_year'], default: 'this_month' }
      }
    }
  }
];

// Generate preview widget for tool approval (shown BEFORE execution)
export const generateToolPreviewWidget = (toolName: string, args: any) => {
  console.log(`Generating preview widget for: ${toolName}`, args);

  switch (toolName) {
    case 'pay_contractors_bulk':
      const totalAmount = args.items.reduce((sum: number, item: any) => sum + item.amount, 0);
      return {
        type: 'Frame',
        size: 'md',
        padding: 'md',
        children: [
          {
            type: 'FrameHeader',
            title: 'Payment Preview',
            expandable: false
          },
          {
            type: 'Row',
            align: 'between',
            children: [
              {
                type: 'Col',
                gap: 'sm',
                children: [
                  { type: 'Text', value: args.batch_reference, size: 'lg', weight: 'semibold' }
                ]
              },
              {
                type: 'Badge',
                label: 'Pending Approval',
                variant: 'warning'
              }
            ]
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
                  { type: 'Amount', value: totalAmount, currency: args.currency, size: 'md', weight: 'semibold' }
                ]
              },
              {
                type: 'Col',
                gap: 'sm',
                children: [
                  { type: 'Text', value: 'Recipients', size: 'xs', color: 'muted' },
                  { type: 'Text', value: args.items.length.toString(), size: 'md', weight: 'semibold' }
                ]
              }
            ]
          },
          args.narration ? { type: 'Divider', spacing: 'md' } : null,
          args.narration ? {
            type: 'Col',
            gap: 'xs',
            children: [
              { type: 'Text', value: 'Narration', size: 'xs', color: 'muted' },
              { type: 'Text', value: args.narration, size: 'sm' }
            ]
          } : null
        ].filter(Boolean)
      };

    case 'set_account_limits':
      return {
        type: 'Frame',
        size: 'md',
        padding: 'md',
        children: [
          {
            type: 'FrameHeader',
            title: 'Account Limits Preview',
            expandable: false
          },
          {
            type: 'KeyValueList',
            gap: 'md',
            dividers: true,
            items: [
              args.balance_limit ? {
                type: 'KeyValueRow',
                label: 'Balance Alert Threshold',
                value: { type: 'Amount', value: args.balance_limit, currency: args.currency || 'NGN', size: 'sm' }
              } : null,
              args.daily_transfer_limit ? {
                type: 'KeyValueRow',
                label: 'Daily Transfer Limit',
                value: { type: 'Amount', value: args.daily_transfer_limit, currency: args.currency || 'NGN', size: 'sm' }
              } : null,
              args.monthly_transfer_limit ? {
                type: 'KeyValueRow',
                label: 'Monthly Transfer Limit',
                value: { type: 'Amount', value: args.monthly_transfer_limit, currency: args.currency || 'NGN', size: 'sm' }
              } : null
            ].filter(Boolean)
          }
        ]
      };

    case 'set_beneficiary_transfer_limit':
      return {
        type: 'Frame',
        size: 'md',
        padding: 'md',
        children: [
          {
            type: 'FrameHeader',
            title: 'Beneficiary Limit Preview',
            expandable: false
          },
          {
            type: 'KeyValueList',
            gap: 'md',
            dividers: true,
            items: [
              {
                type: 'KeyValueRow',
                label: 'Beneficiary',
                value: { type: 'Text', value: args.beneficiary_id, weight: 'medium' }
              },
              {
                type: 'KeyValueRow',
                label: 'Period',
                value: { type: 'Badge', label: args.period, variant: 'default' }
              },
              {
                type: 'KeyValueRow',
                label: 'Limit',
                value: { type: 'Amount', value: args.amount_limit, currency: args.currency || 'NGN', size: 'sm', weight: 'semibold' },
                emphasis: true
              },
              {
                type: 'KeyValueRow',
                label: 'Alert Threshold',
                value: { type: 'Text', value: `${args.alerts_at_percent || 80}%`, color: 'muted' }
              }
            ]
          }
        ]
      };

    case 'create_virtual_card':
      return {
        type: 'Frame',
        size: 'md',
        padding: 'lg',
        children: [
          {
            type: 'FrameHeader',
            title: 'Virtual Card Preview',
            expandable: false
          },
          {
            type: 'Row',
            align: 'between',
            children: [
              { type: 'Text', value: args.label, size: 'lg', weight: 'semibold' },
              { type: 'Badge', label: 'Pending', variant: 'warning' }
            ]
          },
          { type: 'Divider', spacing: 'md' },
          {
            type: 'KeyValueList',
            gap: 'md',
            items: [
              {
                type: 'KeyValueRow',
                label: 'Currency',
                value: { type: 'Text', value: args.currency, weight: 'medium' }
              },
              args.spend_limit ? {
                type: 'KeyValueRow',
                label: 'Spend Limit',
                value: { type: 'Amount', value: args.spend_limit, currency: args.currency, size: 'sm' }
              } : null,
              args.spend_period ? {
                type: 'KeyValueRow',
                label: 'Limit Period',
                value: { type: 'Badge', label: args.spend_period.replace('_', ' '), variant: 'default' }
              } : null,
              args.expires_at ? {
                type: 'KeyValueRow',
                label: 'Expires',
                value: { type: 'Text', value: args.expires_at, size: 'sm', color: 'muted' }
              } : null
            ].filter(Boolean)
          }
        ]
      };

    case 'send_invoice':
      const total = args.line_items.reduce((sum: number, item: any) => sum + (item.amount * (item.quantity ?? 1)), 0);
      return {
        type: 'Frame',
        size: 'md',
        padding: 'md',
        children: [
          {
            type: 'FrameHeader',
            title: 'Invoice Preview',
            expandable: false
          },
          {
            type: 'Row',
            align: 'between',
            children: [
              { type: 'Text', value: args.invoice_number, size: 'lg', weight: 'semibold' },
              { type: 'Badge', label: 'Draft', variant: 'default' }
            ]
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
                value: { type: 'Text', value: `${args.customer.name} (${args.customer.email})`, weight: 'medium' }
              },
              {
                type: 'KeyValueRow',
                label: 'Items',
                value: { type: 'Text', value: `${args.line_items.length} line item(s)`, color: 'muted' }
              },
              {
                type: 'KeyValueRow',
                label: 'Total Amount',
                value: { type: 'Amount', value: total, currency: args.currency, size: 'md', weight: 'semibold' },
                emphasis: true
              },
              args.due_date ? {
                type: 'KeyValueRow',
                label: 'Due Date',
                value: { type: 'Text', value: args.due_date, color: 'muted' }
              } : null
            ].filter(Boolean)
          }
        ]
      };

    case 'aggregate_transactions':
      return {
        type: 'Frame',
        size: 'md',
        padding: 'md',
        children: [
          {
            type: 'FrameHeader',
            title: 'Analytics Query Preview',
            expandable: false
          },
          {
            type: 'KeyValueList',
            gap: 'md',
            dividers: true,
            items: [
              {
                type: 'KeyValueRow',
                label: 'Metric',
                value: { type: 'Badge', label: args.metric.replace(/_/g, ' '), variant: 'default' }
              },
              {
                type: 'KeyValueRow',
                label: 'Period',
                value: { type: 'Text', value: `${args.from} to ${args.to}`, size: 'sm', color: 'muted' }
              },
              args.filters?.beneficiary_id ? {
                type: 'KeyValueRow',
                label: 'Beneficiary Filter',
                value: { type: 'Text', value: args.filters.beneficiary_id, weight: 'medium' }
              } : null,
              args.filters?.category ? {
                type: 'KeyValueRow',
                label: 'Category Filter',
                value: { type: 'Text', value: args.filters.category, weight: 'medium' }
              } : null
            ].filter(Boolean)
          }
        ]
      };

    case 'account_snapshot':
      return {
        type: 'Frame',
        size: 'md',
        padding: 'md',
        children: [
          {
            type: 'FrameHeader',
            title: 'Snapshot Query Preview',
            expandable: false
          },
          {
            type: 'KeyValueList',
            gap: 'md',
            dividers: true,
            items: [
              {
                type: 'KeyValueRow',
                label: 'Scope',
                value: { type: 'Badge', label: args.scope || 'all', variant: 'default' }
              },
              {
                type: 'KeyValueRow',
                label: 'Time Window',
                value: { type: 'Badge', label: (args.window || 'this_month').replace(/_/g, ' '), variant: 'default' }
              },
              args.beneficiary_id ? {
                type: 'KeyValueRow',
                label: 'Beneficiary',
                value: { type: 'Text', value: args.beneficiary_id, weight: 'medium' }
              } : null,
              args.group ? {
                type: 'KeyValueRow',
                label: 'Group',
                value: { type: 'Text', value: args.group, weight: 'medium' }
              } : null
            ].filter(Boolean)
          }
        ]
      };

    default:
      // Fallback generic preview
      return {
        type: 'Frame',
        size: 'md',
        padding: 'md',
        children: [
          {
            type: 'FrameHeader',
            title: 'Tool Preview',
            expandable: false
          },
          {
            type: 'Col',
            gap: 'md',
            children: [
              { type: 'Text', value: `Tool: ${toolName}`, size: 'lg', weight: 'semibold' },
              { type: 'Text', value: 'Arguments provided', size: 'sm', color: 'muted' }
            ]
          }
        ]
      };
  }
};

// Tool execution functions
export const executeToolCall = async (toolName: string, args: any) => {
  console.log(`Executing tool: ${toolName}`, args);
  
  switch (toolName) {
    case 'pay_contractors_bulk':
      const totalAmount = args.items.reduce((sum: number, item: any) => sum + item.amount, 0);
      return {
        status: 'queued',
        batch_reference: args.batch_reference,
        summary: {
          total: args.items.length,
          succeeded: args.items.length,
          failed: 0,
          currency: args.currency,
          amount_total: totalAmount
        },
        message: `Successfully queued payment of ${args.currency} ${totalAmount.toLocaleString()} to ${args.items.length} contractor(s)`,

        _widget: {
          type: 'Frame',
          size: 'md',
          padding: 'md',
          children: [
            {
              type: 'FrameHeader',
              title: 'Payment Batch',
              expandable: true
            },
            {
              type: 'Row',
              align: 'between',
              children: [
                {
                  type: 'Col',
                  gap: 'sm',
                  children: [
                    { type: 'Text', value: args.batch_reference, size: 'lg', weight: 'semibold' }
                  ]
                },
                {
                  type: 'Badge',
                  label: 'Queued',
                  variant: 'warning'
                }
              ]
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
                    { type: 'Amount', value: totalAmount, currency: args.currency, size: 'md', weight: 'semibold' }
                  ]
                },
                {
                  type: 'Col',
                  gap: 'sm',
                  children: [
                    { type: 'Text', value: 'Recipients', size: 'xs', color: 'muted' },
                    { type: 'Text', value: args.items.length.toString(), size: 'md', weight: 'semibold' }
                  ]
                }
              ]
            }
          ]
        }
      };
    
    case 'set_account_limits':
      return {
        status: 'ok',
        applied: args,
        message: 'Account limits have been successfully updated'
      };
    
    case 'set_beneficiary_transfer_limit':
      return {
        status: 'ok',
        beneficiary_id: args.beneficiary_id,
        policy: {
          period: args.period,
          amount_limit: args.amount_limit,
          currency: args.currency || 'NGN',
          alerts_at_percent: args.alerts_at_percent || 80
        },
        message: `Transfer limit set for ${args.beneficiary_id}: ${args.currency || 'NGN'} ${args.amount_limit.toLocaleString()} per ${args.period}`
      };
    
    case 'create_virtual_card':
      const cardId = `vc_${Math.random().toString(36).substr(2, 9)}`;
      const last4 = Math.floor(1000 + Math.random() * 9000).toString();
      return {
        status: 'created',
        card: {
          card_id: cardId,
          label: args.label,
          currency: args.currency,
          spend_limit: args.spend_limit ?? null,
          spend_period: args.spend_period || 'lifetime',
          last4,
          network: 'VISA',
          state: 'active',
          expires_at: args.expires_at ?? null
        },
        message: `Virtual card "${args.label}" created successfully (ending in ${last4})`,

        _widget: {
          type: 'Frame',
          size: 'md',
          padding: 'lg',
          children: [
            {
              type: 'FrameHeader',
              title: 'Virtual Card',
              expandable: true
            },
            {
              type: 'Row',
              align: 'between',
              children: [
                { type: 'Text', value: args.label, size: 'lg', weight: 'semibold' },
                { type: 'Badge', label: 'Active', variant: 'success' }
              ]
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
                    { type: 'Text', value: last4, size: 'xl', weight: 'bold' }
                  ]
                },
                {
                  type: 'KeyValueList',
                  gap: 'md',
                  items: args.spend_limit ? [
                    {
                      type: 'KeyValueRow',
                      label: 'Spend Limit',
                      value: { type: 'Amount', value: args.spend_limit, currency: args.currency, size: 'sm' }
                    },
                    {
                      type: 'KeyValueRow',
                      label: 'Network',
                      value: { type: 'Text', value: 'VISA', weight: 'medium' }
                    }
                  ] : [
                    {
                      type: 'KeyValueRow',
                      label: 'Network',
                      value: { type: 'Text', value: 'VISA', weight: 'medium' }
                    }
                  ]
                }
              ]
            }
          ]
        }
      };
    
    case 'send_invoice':
      const total = args.line_items.reduce((sum: number, item: any) => sum + (item.amount * (item.quantity ?? 1)), 0);
      const invoiceId = `inv_${Math.random().toString(36).substr(2, 9)}`;
      return {
        status: 'sent',
        invoice_id: invoiceId,
        invoice_number: args.invoice_number,
        amount_due: total,
        currency: args.currency,
        hosted_invoice_url: `https://pay.moniewave.com/${invoiceId}`,
        due_date: args.due_date ?? null,
        customer_viewed: false,
        message: `Invoice ${args.invoice_number} for ${args.currency} ${total.toLocaleString()} sent to ${args.customer.name}`,

        _widget: {
          type: 'Frame',
          size: 'md',
          padding: 'md',
          children: [
            {
              type: 'FrameHeader',
              title: 'Invoice',
              expandable: true
            },
            {
              type: 'Row',
              align: 'between',
              children: [
                { type: 'Text', value: args.invoice_number, size: 'lg', weight: 'semibold' },
                { type: 'Badge', label: 'Sent', variant: 'default' }
              ]
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
                  value: { type: 'Text', value: args.customer.name, weight: 'medium' }
                },
                {
                  type: 'KeyValueRow',
                  label: 'Amount Due',
                  value: { type: 'Amount', value: total, currency: args.currency, size: 'md', weight: 'semibold' },
                  emphasis: true
                },
                args.due_date ? {
                  type: 'KeyValueRow',
                  label: 'Due Date',
                  value: { type: 'Text', value: args.due_date, color: 'muted' }
                } : null
              ].filter(Boolean)
            }
          ]
        }
      };
    
    case 'aggregate_transactions':
      if (args.metric === 'top_categories') {
        const items = [
          { category: 'Food', value: 18000 },
          { category: 'Family Transfers', value: 42500 },
          { category: 'Transport', value: 9000 }
        ];
        const totalValue = items.reduce((sum, item) => sum + item.value, 0);

        return {
          metric: args.metric,
          items,
          currency: args.currency || 'NGN',
          period: { from: args.from, to: args.to },

          _widget: {
            type: 'Frame',
            size: 'md',
            padding: 'md',
            children: [
              {
                type: 'FrameHeader',
                title: 'Transaction Analytics',
                expandable: true
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
                      { type: 'Text', value: 'Top Categories', size: 'lg', weight: 'semibold' }
                    ]
                  },
                  { type: 'Divider', spacing: 'md' },
                  {
                    type: 'KeyValueList',
                    gap: 'md',
                    dividers: true,
                    items: items.map(item => ({
                      type: 'KeyValueRow',
                      label: item.category,
                      value: { type: 'Amount', value: item.value, currency: args.currency || 'NGN', size: 'sm', weight: 'medium' }
                    }))
                  },
                  { type: 'Divider', spacing: 'md' },
                  {
                    type: 'Row',
                    align: 'between',
                    children: [
                      { type: 'Text', value: 'Total', size: 'sm', weight: 'semibold' },
                      { type: 'Amount', value: totalValue, currency: args.currency || 'NGN', size: 'md', weight: 'bold', color: 'default' }
                    ]
                  }
                ]
              }
            ]
          }
        };
      }

      const mockValue = Math.floor(Math.random() * 500000) + 100000;
      return {
        metric: args.metric,
        value: mockValue,
        currency: args.currency || 'NGN',
        period: { from: args.from, to: args.to }
      };
    
    case 'account_snapshot':
      const snapshotData = {
        balance: {
          currency: 'NGN',
          available: 720000
        },
        window: args.window || 'this_month',
        transfers: {
          count: 14,
          value: 155000
        },
        invoices: {
          sent: 5,
          paid: 3,
          value_paid: 610000
        },
        top_beneficiaries: args.beneficiary_id
          ? [{ id: args.beneficiary_id, value: 42500 }]
          : [
              { id: 'sib-chioma', value: 42500 },
              { id: 'mom', value: 38000 }
            ]
      };

      return {
        ...snapshotData,

        _widget: {
          type: 'Frame',
          size: 'lg',
          padding: 'lg',
          children: [
            {
              type: 'FrameHeader',
              title: 'Account Overview',
              expandable: true
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
                    { type: 'Amount', value: snapshotData.balance.available, currency: snapshotData.balance.currency, size: 'xl', weight: 'bold', color: 'default' }
                  ]
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
                        { type: 'Text', value: snapshotData.transfers.count.toString(), size: 'lg', weight: 'semibold' },
                        { type: 'Amount', value: snapshotData.transfers.value, currency: snapshotData.balance.currency, size: 'sm', showCurrency: false }
                      ]
                    },
                    {
                      type: 'Col',
                      gap: 'sm',
                      children: [
                        { type: 'Text', value: 'Invoices Paid', size: 'xs', color: 'muted' },
                        { type: 'Text', value: `${snapshotData.invoices.paid}/${snapshotData.invoices.sent}`, size: 'lg', weight: 'semibold' },
                        { type: 'Amount', value: snapshotData.invoices.value_paid, currency: snapshotData.balance.currency, size: 'sm', showCurrency: false }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      };
    
    default:
      return { error: 'Unknown tool' };
  }
};
