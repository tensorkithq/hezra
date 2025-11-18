import { z } from 'zod';
import {
  frame,
  frameHeader,
  frameTitle,
  frameContent,
  row,
  col,
  text,
  amount,
  divider,
  keyValueList,
  keyValueRow,
} from '@/components/widgets/builders';

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
      return frame([
        frameHeader([
          frameTitle('Payment Preview'),
        ]),
        frameContent([
          row([
            col([
              text(args.batch_reference, { size: 'lg', weight: 'semibold' })
            ], { gap: 'sm' }),
            text('Pending Approval', { color: 'warning', weight: 'medium', size: 'sm' })
          ], { align: 'between' }),
          divider({ spacing: 'md' }),
          row([
            col([
              text('Total Amount', { size: 'xs', color: 'muted' }),
              amount(totalAmount, { currency: args.currency, size: 'md', weight: 'semibold' })
            ], { gap: 'sm' }),
            col([
              text('Recipients', { size: 'xs', color: 'muted' }),
              text(args.items.length.toString(), { size: 'md', weight: 'semibold' })
            ], { gap: 'sm' })
          ], { gap: 'lg' }),
          ...(args.narration ? [
            divider({ spacing: 'md' }),
            col([
              text('Narration', { size: 'xs', color: 'muted' }),
              text(args.narration, { size: 'sm' })
            ], { gap: 'xs' })
          ] : [])
        ]),
      ]);

    case 'set_account_limits':
      return frame([
        frameHeader([
          frameTitle('Account Limits Preview'),
        ]),
        frameContent([
          keyValueList([
            ...(args.balance_limit ? [
              keyValueRow('Balance Alert Threshold', amount(args.balance_limit, { currency: args.currency || 'NGN', size: 'sm' }))
            ] : []),
            ...(args.daily_transfer_limit ? [
              keyValueRow('Daily Transfer Limit', amount(args.daily_transfer_limit, { currency: args.currency || 'NGN', size: 'sm' }))
            ] : []),
            ...(args.monthly_transfer_limit ? [
              keyValueRow('Monthly Transfer Limit', amount(args.monthly_transfer_limit, { currency: args.currency || 'NGN', size: 'sm' }))
            ] : []),
          ], { gap: 'md', dividers: true })
        ]),
      ]);

    case 'set_beneficiary_transfer_limit':
      return frame([
        frameHeader([
          frameTitle('Beneficiary Limit Preview'),
        ]),
        frameContent([
          keyValueList([
            keyValueRow('Beneficiary', text(args.beneficiary_id, { weight: 'medium' })),
            keyValueRow('Period', text(args.period, { weight: 'medium', size: 'sm' })),
            keyValueRow('Limit', amount(args.amount_limit, { currency: args.currency || 'NGN', size: 'sm', weight: 'semibold' }), { emphasis: true }),
            keyValueRow('Alert Threshold', text(`${args.alerts_at_percent || 80}%`, { color: 'muted' })),
          ], { gap: 'md', dividers: true })
        ]),
      ]);

    case 'create_virtual_card':
      return frame([
        frameHeader([
          frameTitle('Virtual Card Preview'),
        ]),
        frameContent([
          row([
            text(args.label, { size: 'lg', weight: 'semibold' }),
            text('Pending', { color: 'warning', weight: 'medium', size: 'sm' })
          ], { align: 'between' }),
          divider({ spacing: 'md' }),
          keyValueList([
            keyValueRow('Currency', text(args.currency, { weight: 'medium' })),
            ...(args.spend_limit ? [
              keyValueRow('Spend Limit', amount(args.spend_limit, { currency: args.currency, size: 'sm' }))
            ] : []),
            ...(args.spend_period ? [
              keyValueRow('Limit Period', text(args.spend_period.replace('_', ' '), { weight: 'medium', size: 'sm' }))
            ] : []),
            ...(args.expires_at ? [
              keyValueRow('Expires', text(args.expires_at, { size: 'sm', color: 'muted' }))
            ] : []),
          ], { gap: 'md' })
        ]),
      ]);

    case 'send_invoice':
      const total = args.line_items.reduce((sum: number, item: any) => sum + (item.amount * (item.quantity ?? 1)), 0);
      return frame([
        frameHeader([
          frameTitle('Invoice Preview'),
        ]),
        frameContent([
          row([
            text(args.invoice_number, { size: 'lg', weight: 'semibold' }),
            text('Draft', { weight: 'medium', size: 'sm' })
          ], { align: 'between' }),
          divider({ spacing: 'md' }),
          keyValueList([
            keyValueRow('Customer', text(`${args.customer.name} (${args.customer.email})`, { weight: 'medium' })),
            keyValueRow('Items', text(`${args.line_items.length} line item(s)`, { color: 'muted' })),
            keyValueRow('Total Amount', amount(total, { currency: args.currency, size: 'md', weight: 'semibold' }), { emphasis: true }),
            ...(args.due_date ? [
              keyValueRow('Due Date', text(args.due_date, { color: 'muted' }))
            ] : []),
          ], { gap: 'md', dividers: true })
        ]),
      ]);

    case 'aggregate_transactions':
      return frame([
        frameHeader([
          frameTitle('Analytics Query Preview'),
        ]),
        frameContent([
          keyValueList([
            keyValueRow('Metric', text(args.metric.replace(/_/g, ' '), { weight: 'medium', size: 'sm' })),
            keyValueRow('Period', text(`${args.from} to ${args.to}`, { size: 'sm', color: 'muted' })),
            ...(args.filters?.beneficiary_id ? [
              keyValueRow('Beneficiary Filter', text(args.filters.beneficiary_id, { weight: 'medium' }))
            ] : []),
            ...(args.filters?.category ? [
              keyValueRow('Category Filter', text(args.filters.category, { weight: 'medium' }))
            ] : []),
          ], { gap: 'md', dividers: true })
        ]),
      ]);

    case 'account_snapshot':
      return frame([
        frameHeader([
          frameTitle('Snapshot Query Preview'),
        ]),
        frameContent([
          keyValueList([
            keyValueRow('Scope', text(args.scope || 'all', { weight: 'medium', size: 'sm' })),
            keyValueRow('Time Window', text((args.window || 'this_month').replace(/_/g, ' '), { weight: 'medium', size: 'sm' })),
            ...(args.beneficiary_id ? [
              keyValueRow('Beneficiary', text(args.beneficiary_id, { weight: 'medium' }))
            ] : []),
            ...(args.group ? [
              keyValueRow('Group', text(args.group, { weight: 'medium' }))
            ] : []),
          ], { gap: 'md', dividers: true })
        ]),
      ]);

    default:
      // Fallback generic preview
      return frame([
        frameHeader([
          frameTitle('Tool Preview'),
        ]),
        frameContent([
          col([
            text(`Tool: ${toolName}`, { size: 'lg', weight: 'semibold' }),
            text('Arguments provided', { size: 'sm', color: 'muted' })
          ], { gap: 'md' })
        ]),
      ]);
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

        _widget: frame([
          frameHeader([
            frameTitle('Payment Batch'),
          ]),
          frameContent([
            row([
              col([
                text(args.batch_reference, { size: 'lg', weight: 'semibold' })
              ], { gap: 'sm' }),
              text('Queued', { color: 'warning', weight: 'medium', size: 'sm' })
            ], { align: 'between' }),
            divider({ spacing: 'md' }),
            row([
              col([
                text('Total Amount', { size: 'xs', color: 'muted' }),
                amount(totalAmount, { currency: args.currency, size: 'md', weight: 'semibold' })
              ], { gap: 'sm' }),
              col([
                text('Recipients', { size: 'xs', color: 'muted' }),
                text(args.items.length.toString(), { size: 'md', weight: 'semibold' })
              ], { gap: 'sm' })
            ], { gap: 'lg' })
          ]),
        ])
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

        _widget: frame([
          frameHeader([
            frameTitle('Virtual Card'),
          ]),
          frameContent([
            row([
              text(args.label, { size: 'lg', weight: 'semibold' }),
              text('Active', { color: 'success', weight: 'medium', size: 'sm' })
            ], { align: 'between' }),
            divider({ spacing: 'md' }),
            col([
              row([
                text('****', { size: 'xl', weight: 'bold' }),
                text('****', { size: 'xl', weight: 'bold' }),
                text('****', { size: 'xl', weight: 'bold' }),
                text(last4, { size: 'xl', weight: 'bold' })
              ], { gap: 'md' }),
              keyValueList([
                ...(args.spend_limit ? [
                  keyValueRow('Spend Limit', amount(args.spend_limit, { currency: args.currency, size: 'sm' })),
                ] : []),
                keyValueRow('Network', text('VISA', { weight: 'medium' })),
              ], { gap: 'md' })
            ], { gap: 'md' })
          ]),
        ])
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

        _widget: frame([
          frameHeader([
            frameTitle('Invoice'),
          ]),
          frameContent([
            row([
              text(args.invoice_number, { size: 'lg', weight: 'semibold' }),
              text('Sent', { weight: 'medium', size: 'sm' })
            ], { align: 'between' }),
            divider({ spacing: 'md' }),
            keyValueList([
              keyValueRow('Customer', text(args.customer.name, { weight: 'medium' })),
              keyValueRow('Amount Due', amount(total, { currency: args.currency, size: 'md', weight: 'semibold' }), { emphasis: true }),
              ...(args.due_date ? [
                keyValueRow('Due Date', text(args.due_date, { color: 'muted' }))
              ] : []),
            ], { gap: 'md', dividers: true })
          ]),
        ])
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

          _widget: frame([
            frameHeader([
              frameTitle('Transaction Analytics'),
            ]),
            frameContent([
              col([
                row([
                  text('Top Categories', { size: 'lg', weight: 'semibold' })
                ], { align: 'center', gap: 'sm' }),
                divider({ spacing: 'md' }),
                keyValueList(
                  items.map(item => keyValueRow(
                    item.category,
                    amount(item.value, { currency: args.currency || 'NGN', size: 'sm', weight: 'medium' })
                  )),
                  { gap: 'md', dividers: true }
                ),
                divider({ spacing: 'md' }),
                row([
                  text('Total', { size: 'sm', weight: 'semibold' }),
                  amount(totalValue, { currency: args.currency || 'NGN', size: 'md', weight: 'bold', color: 'default' })
                ], { align: 'between' })
              ], { gap: 'md' })
            ]),
          ])
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

        _widget: frame([
          frameHeader([
            frameTitle('Account Overview'),
          ]),
          frameContent([
            col([
              col([
                text('Available Balance', { size: 'sm', color: 'muted' }),
                amount(snapshotData.balance.available, { currency: snapshotData.balance.currency, size: 'xl', weight: 'bold', color: 'default' })
              ], { gap: 'sm', align: 'center' }),
              divider({ spacing: 'lg' }),
              row([
                col([
                  text('Transfers', { size: 'xs', color: 'muted' }),
                  text(snapshotData.transfers.count.toString(), { size: 'lg', weight: 'semibold' }),
                  amount(snapshotData.transfers.value, { currency: snapshotData.balance.currency, size: 'sm', showCurrency: false })
                ], { gap: 'sm' }),
                col([
                  text('Invoices Paid', { size: 'xs', color: 'muted' }),
                  text(`${snapshotData.invoices.paid}/${snapshotData.invoices.sent}`, { size: 'lg', weight: 'semibold' }),
                  amount(snapshotData.invoices.value_paid, { currency: snapshotData.balance.currency, size: 'sm', showCurrency: false })
                ], { gap: 'sm' })
              ], { gap: 'lg' })
            ], { gap: 'lg' })
          ]),
        ])
      };
    
    default:
      return { error: 'Unknown tool' };
  }
};
