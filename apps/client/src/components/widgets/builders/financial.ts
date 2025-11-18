/**
 * Financial Widget Builders
 *
 * Specialized builders for financial widgets like payment summaries,
 * invoices, limits, virtual cards, etc.
 */

import type { FrameProps } from '../types';
import { frame } from './primitives';
import { keyValueList, type KeyValueField } from './patterns';

// ============================================================================
// Data Interfaces
// ============================================================================

export interface PaymentSummaryData {
  batchReference: string;
  totalAmount: number;
  recipientCount: number;
  currency: string;
  status: string;
  timestamp: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  currency: string;
  dueDate: string;
  status: string;
}

export interface LimitData {
  accountLimit: number;
  dailyLimit: number;
  monthlyLimit: number;
  beneficiaryLimit: number;
  currency: string;
}

export interface TransactionAggregateData {
  totalTransferValue: number;
  totalTransferCount: number;
  topCategory: string;
  period: string;
  currency: string;
}

export interface VirtualCardData {
  cardLabel: string;
  cardNumber: string;
  spendLimit: number;
  spendPeriod: string;
  expiresAt: string;
  currency: string;
}

export interface AccountSnapshotData {
  accountBalance: number;
  availableBalance: number;
  currency: string;
  accountNumber: string;
  accountName: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

const formatCurrency = (amount: number, currency: string = 'NGN'): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDateShort = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// ============================================================================
// Financial Widget Builders
// ============================================================================

/**
 * Payment Summary Widget
 *
 * Displays batch payment information with summary fields.
 */
export const paymentSummary = (data: PaymentSummaryData): FrameProps => {
  const fields: KeyValueField[] = [
    { label: 'Batch Reference', value: data.batchReference },
    { label: 'Total Amount', value: formatCurrency(data.totalAmount, data.currency) },
    { label: 'Recipients', value: `${data.recipientCount} beneficiaries` },
    { label: 'Status', value: data.status },
    { label: 'Created', value: formatDate(data.timestamp) },
  ];

  return frame([keyValueList(fields)], {
    className: 'payment-summary-widget',
  });
};

/**
 * Invoice Widget
 *
 * Displays invoice details with customer and payment information.
 */
export const invoice = (data: InvoiceData): FrameProps => {
  const fields: KeyValueField[] = [
    { label: 'Invoice Number', value: data.invoiceNumber },
    { label: 'Customer', value: data.customerName },
    { label: 'Email', value: data.customerEmail },
    { label: 'Total Amount', value: formatCurrency(data.totalAmount, data.currency) },
    { label: 'Due Date', value: formatDateShort(data.dueDate) },
    { label: 'Status', value: data.status },
  ];

  return frame([keyValueList(fields)], {
    className: 'invoice-widget',
  });
};

/**
 * Account Limits Widget
 *
 * Displays account and transaction limits.
 */
export const limit = (data: LimitData): FrameProps => {
  const fields: KeyValueField[] = [
    { label: 'Account Balance Limit', value: formatCurrency(data.accountLimit, data.currency) },
    { label: 'Daily Transfer Limit', value: formatCurrency(data.dailyLimit, data.currency) },
    {
      label: 'Monthly Transfer Limit',
      value: formatCurrency(data.monthlyLimit, data.currency),
    },
    {
      label: 'Per-Beneficiary Limit',
      value: formatCurrency(data.beneficiaryLimit, data.currency),
    },
  ];

  return frame([keyValueList(fields)], {
    className: 'limit-widget',
  });
};

/**
 * Transaction Aggregate Widget
 *
 * Displays aggregated transaction analytics.
 */
export const transactionAggregate = (data: TransactionAggregateData): FrameProps => {
  const fields: KeyValueField[] = [
    { label: 'Period', value: data.period },
    {
      label: 'Total Transfer Value',
      value: formatCurrency(data.totalTransferValue, data.currency),
    },
    { label: 'Total Transfers', value: `${data.totalTransferCount} transactions` },
    { label: 'Top Category', value: data.topCategory },
  ];

  return frame([keyValueList(fields)], {
    className: 'transaction-aggregate-widget',
  });
};

/**
 * Virtual Card Widget
 *
 * Displays virtual card details.
 */
export const virtualCard = (data: VirtualCardData): FrameProps => {
  const fields: KeyValueField[] = [
    { label: 'Card Label', value: data.cardLabel },
    { label: 'Card Number', value: data.cardNumber },
    { label: 'Spend Limit', value: formatCurrency(data.spendLimit, data.currency) },
    { label: 'Spend Period', value: data.spendPeriod },
    { label: 'Expires', value: formatDateShort(data.expiresAt) },
  ];

  return frame([keyValueList(fields)], {
    className: 'virtual-card-widget',
  });
};

/**
 * Account Snapshot Widget
 *
 * Displays account balance and details.
 */
export const accountSnapshot = (data: AccountSnapshotData): FrameProps => {
  const fields: KeyValueField[] = [
    { label: 'Account Number', value: data.accountNumber },
    { label: 'Account Name', value: data.accountName },
    {
      label: 'Account Balance',
      value: formatCurrency(data.accountBalance, data.currency),
      emphasis: true,
    },
    {
      label: 'Available Balance',
      value: formatCurrency(data.availableBalance, data.currency),
    },
  ];

  return frame([keyValueList(fields)], {
    className: 'account-snapshot-widget',
  });
};

// ============================================================================
// Exports
// ============================================================================

/**
 * Financial builder namespace
 *
 * Usage:
 * ```ts
 * import { financial } from '@/components/widgets/builders/financial';
 *
 * const widget = financial.paymentSummary({
 *   totalAmount: 1000,
 *   currency: 'USD',
 *   // ...
 * });
 * ```
 */
export const financial = {
  paymentSummary,
  invoice,
  limit,
  transactionAggregate,
  virtualCard,
  accountSnapshot,
};
