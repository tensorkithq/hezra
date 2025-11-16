import React, { useState, useEffect } from 'react';
import { useOpenAIVoiceAgent } from "@/components/openai/useOpenAIVoiceAgent";
import { generateToolPreviewWidget } from "@/components/openai/tools";
import VoiceOrbFixed from "@/components/VoiceOrbFixed";
import ConversationMessage from "@/components/ConversationMessage";
import { WidgetRenderer } from "@/components/widgets/WidgetRenderer";
import { WidgetDrawer } from "@/components/widgets/WidgetDrawer";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronDown } from "lucide-react";

// Asset URLs - Desktop
const desktopMicrophone = "https://www.figma.com/api/mcp/asset/63705224-77da-4bde-b75e-9850073335a5";
const desktopX = "https://www.figma.com/api/mcp/asset/9069ceb0-5bf4-46a6-af3f-c90723f95cc3";

// Asset URLs - Mobile  
const mobileMicrophone = "https://www.figma.com/api/mcp/asset/5acda19f-003d-4f5e-8fe7-d7f0e8af0623";
const mobileX = "https://www.figma.com/api/mcp/asset/3842a2d0-7c39-4449-a845-96b026eeb481";

// Widget Asset URLs
const closeIcon = "https://www.figma.com/api/mcp/asset/f4a54d9b-b28d-4ee9-b842-5e90bb32a276";
const expandIcon = "https://www.figma.com/api/mcp/asset/78ae5741-9dc3-46e0-a956-9ae8007c4e60";
const accountCloseIcon = "https://www.figma.com/api/mcp/asset/c7ccbd97-262c-48ff-bc02-5bee248c7a5d";

// Sidebar Types
export type SidebarVariant = 'save-beneficiary' | 'account-info' | 'receipt' | 'account-snapshot' | 'payment-summary' | 'invoice' | 'limit' | 'transaction-aggregate' | 'virtual-card';

export interface SidebarField {
  label: string;
  value: string;
}

export interface SidebarProps {
  variant: SidebarVariant;
  title?: string;
  fields: SidebarField[];
  receiptImages?: string[];
  onClose?: () => void;
  onExpand?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
  isExpanded?: boolean;
  className?: string;
}

// Sidebar Component - EXACT copy of AccountInformationModal structure
const Sidebar: React.FC<SidebarProps> = ({
  variant,
  title,
  fields,
  receiptImages = [],
  onClose,
  onExpand,
  onShare,
  onDownload,
  isExpanded = false,
  className = '',
}) => {
  const getTitleText = () => {
    if (title) return title;
    switch (variant) {
      case 'save-beneficiary':
        return 'Save beneficiary';
      case 'account-info':
        return 'Account information';
      case 'receipt':
        return 'Receipt';
      case 'account-snapshot':
        return 'Account Overview';
      case 'payment-summary':
        return 'Payment Batch';
      case 'invoice':
        return 'Invoice';
      case 'limit':
        return 'Account Limits';
      case 'transaction-aggregate':
        return 'Transaction Analytics';
      case 'virtual-card':
        return 'Virtual Card';
      default:
        return '';
    }
  };

  return (
    <div
      className={`
        bg-black rounded-[32px] p-10 flex flex-col gap-10 items-start relative w-full h-full
        ${className}
      `}
    >
      {/* Title Bar */}
      <div className="flex gap-4 items-start justify-center w-full shrink-0">
        <p className="flex-1 font-['Avenir_Next',sans-serif] font-semibold text-2xl leading-8 text-white whitespace-pre-wrap min-h-0 min-w-0">
          {getTitleText()}
        </p>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="flex items-center justify-center px-0 py-1 shrink-0 hover:opacity-80 transition-opacity"
          aria-label="Close"
        >
          <div className="relative w-6 h-6 shrink-0">
            <div className="absolute inset-[18.75%]">
              <div className="absolute inset-0">
                <img
                  alt="Close"
                  className="block max-w-none w-full h-full"
                  src={closeIcon}
                />
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Form Fields */}
      <div className="flex flex-col gap-4 items-start w-full shrink-0">
        {fields.map((field, index) => {
          const isLast = index === fields.length - 1;
          return (
            <div
              key={index}
              className={`
                flex gap-2 items-center justify-center w-full text-base leading-6 text-white shrink-0
                ${!isLast ? 'border-b border-white/16 pb-4' : ''}
              `}
            >
              <p className="flex-1 font-['Avenir_Next',sans-serif] font-normal min-h-0 min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">
                {field.label}
              </p>
              <p className="font-['Avenir_Next',sans-serif] font-bold shrink-0">
                {field.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Ring Border */}
      <div className="absolute border border-black border-solid inset-[-8px] rounded-[40px] pointer-events-none" />
    </div>
  );
};

// Receipt Modal Types
export interface ReceiptModalProps {
  amount?: string;
  accountNumber?: string;
  bankName?: string;
  recipientName?: string;
  receiptImages?: string[];
  onClose?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
}

// Receipt Modal Component - EXACT copy of AccountInformationModal structure
const ReceiptModal: React.FC<ReceiptModalProps> = ({
  amount = '$150',
  accountNumber = '1234567890',
  bankName = 'Chase Bank',
  recipientName = 'Michael David Wayner',
  receiptImages = [],
  onClose,
  onShare,
  onDownload,
}) => {
  return (
    <div
      className="bg-black rounded-[32px] p-10 flex flex-col gap-10 items-start relative w-full h-full"
    >
      {/* Title Bar */}
      <div className="flex gap-4 items-start justify-center w-full shrink-0">
        <p className="flex-1 font-['Avenir_Next',sans-serif] font-semibold text-2xl leading-8 text-white whitespace-pre-wrap min-h-0 min-w-0">
          Receipt
        </p>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="flex items-center justify-center px-0 py-1 shrink-0 hover:opacity-80 transition-opacity"
          aria-label="Close"
        >
          <div className="relative w-6 h-6 shrink-0">
            <div className="absolute inset-[18.75%]">
              <div className="absolute inset-0">
                <img
                  alt="Close"
                  className="block max-w-none w-full h-full"
                  src={closeIcon}
                />
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Carousel Section */}
      <div className="flex gap-4 items-start w-full shrink-0 overflow-x-auto pb-2">
        {receiptImages.length > 0 ? (
          receiptImages.map((image, index) => (
            <div
              key={index}
              className="bg-white h-[200px] min-w-[280px] rounded-2xl shrink-0"
              style={{ backgroundImage: `url(${image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            />
          ))
        ) : (
          <>
            <div className="bg-white h-[200px] min-w-[280px] rounded-2xl shrink-0" />
            <div className="bg-white h-[200px] min-w-[280px] rounded-2xl shrink-0" />
          </>
        )}
      </div>

      {/* Form Fields */}
      <div className="flex flex-col gap-4 items-start w-full shrink-0">
        {[
          { label: 'Amount', value: amount },
          { label: 'Account number', value: accountNumber },
          { label: 'Bank name', value: bankName },
          { label: 'Name', value: recipientName },
        ].map((field, index) => {
          const isLast = index === 3;
          return (
            <div
              key={index}
              className={`
                flex gap-2 items-center justify-center w-full text-base leading-6 text-white shrink-0
                ${!isLast ? 'border-b border-white/16 pb-4' : ''}
              `}
            >
              <p className="flex-1 font-['Avenir_Next',sans-serif] font-normal min-h-0 min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">
                {field.label}
              </p>
              <p className="font-['Avenir_Next',sans-serif] font-bold shrink-0">
                {field.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 items-start w-full shrink-0">
        <button
          onClick={onShare}
          className="border border-solid border-white flex-1 flex gap-2 items-center justify-center px-6 py-4 rounded-[56px] shrink-0 min-h-0 min-w-0 hover:bg-white/10 transition-colors"
          aria-label="Share"
        >
          <p className="font-['Avenir_Next',sans-serif] font-semibold text-base leading-6 text-white tracking-[0.64px] overflow-ellipsis overflow-hidden shrink-0">
            Share
          </p>
        </button>

        <button
          onClick={onDownload}
          className="bg-white flex-1 flex gap-2 items-center justify-center px-6 py-4 rounded-[56px] shrink-0 min-h-0 min-w-0 hover:bg-white/90 transition-colors"
          aria-label="Download"
        >
          <p className="font-['Avenir_Next',sans-serif] font-semibold text-base leading-6 text-black tracking-[0.64px] overflow-ellipsis overflow-hidden shrink-0">
            Download
          </p>
        </button>
      </div>

      {/* Ring Border */}
      <div className="absolute border border-black border-solid inset-[-8px] rounded-[40px] pointer-events-none" />
    </div>
  );
};

// Account Snapshot Modal Types
export interface AccountSnapshotModalProps {
  balance?: number;
  currency?: string;
  transferCount?: number;
  transferValue?: number;
  invoicesSent?: number;
  invoicesPaid?: number;
  invoiceValuePaid?: number;
  onClose?: () => void;
  className?: string;
}

// Account Snapshot Modal Component
const AccountSnapshotModal: React.FC<AccountSnapshotModalProps> = ({
  balance = 720000,
  currency = 'NGN',
  transferCount = 14,
  transferValue = 155000,
  invoicesSent = 5,
  invoicesPaid = 3,
  invoiceValuePaid = 610000,
  onClose,
  className = '',
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div
      className={`
        bg-black rounded-[32px] p-10 flex flex-col gap-10 items-start relative w-full h-full
        ${className}
      `}
    >
      {/* Title Bar */}
      <div className="flex gap-4 items-start justify-center w-full shrink-0">
        <p className="flex-1 font-['Avenir_Next',sans-serif] font-semibold text-2xl leading-8 text-white whitespace-pre-wrap min-h-0 min-w-0">
          Account Overview
        </p>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="flex items-center justify-center px-0 py-1 shrink-0 hover:opacity-80 transition-opacity"
          aria-label="Close"
        >
          <div className="relative w-6 h-6 shrink-0">
            <div className="absolute inset-[18.75%]">
              <div className="absolute inset-0">
                <img
                  alt="Close"
                  className="block max-w-none w-full h-full"
                  src={accountCloseIcon}
                />
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Form Fields */}
      <div className="flex flex-col gap-4 items-start w-full shrink-0">
        {[
          { label: 'Available Balance', value: formatCurrency(balance) },
          { label: 'Transfers', value: `${transferCount} transactions` },
          { label: 'Transfer Value', value: formatCurrency(transferValue) },
          { label: 'Invoices Sent', value: `${invoicesSent}` },
          { label: 'Invoices Paid', value: `${invoicesPaid} of ${invoicesSent}` },
          { label: 'Invoice Value Paid', value: formatCurrency(invoiceValuePaid) },
        ].map((field, index) => {
          const isLast = index === 5;
          return (
            <div
              key={index}
              className={`
                flex gap-2 items-center justify-center w-full text-base leading-6 text-white shrink-0
                ${!isLast ? 'border-b border-white/16 pb-4' : ''}
              `}
            >
              <p className="flex-1 font-['Avenir_Next',sans-serif] font-normal min-h-0 min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">
                {field.label}
              </p>
              <p className="font-['Avenir_Next',sans-serif] font-bold shrink-0">
                {field.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Ring Border */}
      <div className="absolute border border-black border-solid inset-[-8px] rounded-[40px] pointer-events-none" />
    </div>
  );
};

// Payment Summary Modal Types
export interface PaymentSummaryModalProps {
  batchReference?: string;
  totalAmount?: number;
  recipientCount?: number;
  currency?: string;
  status?: string;
  timestamp?: string;
  onClose?: () => void;
  className?: string;
}

// Payment Summary Modal Component
const PaymentSummaryModal: React.FC<PaymentSummaryModalProps> = ({
  batchReference = 'BATCH-2024-001',
  totalAmount = 150000,
  recipientCount = 5,
  currency = 'NGN',
  status = 'Queued',
  timestamp = '2024-01-15T10:30:00Z',
  onClose,
  className = '',
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className={`
        bg-black rounded-[32px] p-10 flex flex-col gap-10 items-start relative w-full h-full
        ${className}
      `}
    >
      {/* Title Bar */}
      <div className="flex gap-4 items-start justify-center w-full shrink-0">
        <p className="flex-1 font-['Avenir_Next',sans-serif] font-semibold text-2xl leading-8 text-white whitespace-pre-wrap min-h-0 min-w-0">
          Payment Batch
        </p>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="flex items-center justify-center px-0 py-1 shrink-0 hover:opacity-80 transition-opacity"
          aria-label="Close"
        >
          <div className="relative w-6 h-6 shrink-0">
            <div className="absolute inset-[18.75%]">
              <div className="absolute inset-0">
                <img
                  alt="Close"
                  className="block max-w-none w-full h-full"
                  src={accountCloseIcon}
                />
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Form Fields */}
      <div className="flex flex-col gap-4 items-start w-full shrink-0">
        {[
          { label: 'Batch Reference', value: batchReference },
          { label: 'Total Amount', value: formatCurrency(totalAmount) },
          { label: 'Recipients', value: `${recipientCount} beneficiaries` },
          { label: 'Status', value: status },
          { label: 'Created', value: formatDate(timestamp) },
        ].map((field, index) => {
          const isLast = index === 4;
          return (
            <div
              key={index}
              className={`
                flex gap-2 items-center justify-center w-full text-base leading-6 text-white shrink-0
                ${!isLast ? 'border-b border-white/16 pb-4' : ''}
              `}
            >
              <p className="flex-1 font-['Avenir_Next',sans-serif] font-normal min-h-0 min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">
                {field.label}
              </p>
              <p className="font-['Avenir_Next',sans-serif] font-bold shrink-0">
                {field.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Ring Border */}
      <div className="absolute border border-black border-solid inset-[-8px] rounded-[40px] pointer-events-none" />
    </div>
  );
};

// Invoice Modal Types
export interface InvoiceModalProps {
  invoiceNumber?: string;
  customerName?: string;
  customerEmail?: string;
  totalAmount?: number;
  currency?: string;
  dueDate?: string;
  status?: string;
  onClose?: () => void;
  className?: string;
}

// Invoice Modal Component
const InvoiceModal: React.FC<InvoiceModalProps> = ({
  invoiceNumber = 'INV-2024-0123',
  customerName = 'Acme Corporation',
  customerEmail = 'finance@acme.com',
  totalAmount = 250000,
  currency = 'NGN',
  dueDate = '2024-02-15',
  status = 'Pending',
  onClose,
  className = '',
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div
      className={`
        bg-black rounded-[32px] p-10 flex flex-col gap-10 items-start relative w-full h-full
        ${className}
      `}
    >
      {/* Title Bar */}
      <div className="flex gap-4 items-start justify-center w-full shrink-0">
        <p className="flex-1 font-['Avenir_Next',sans-serif] font-semibold text-2xl leading-8 text-white whitespace-pre-wrap min-h-0 min-w-0">
          Invoice
        </p>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="flex items-center justify-center px-0 py-1 shrink-0 hover:opacity-80 transition-opacity"
          aria-label="Close"
        >
          <div className="relative w-6 h-6 shrink-0">
            <div className="absolute inset-[18.75%]">
              <div className="absolute inset-0">
                <img
                  alt="Close"
                  className="block max-w-none w-full h-full"
                  src={accountCloseIcon}
                />
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Form Fields */}
      <div className="flex flex-col gap-4 items-start w-full shrink-0">
        {[
          { label: 'Invoice Number', value: invoiceNumber },
          { label: 'Customer', value: customerName },
          { label: 'Email', value: customerEmail },
          { label: 'Total Amount', value: formatCurrency(totalAmount) },
          { label: 'Due Date', value: formatDate(dueDate) },
          { label: 'Status', value: status },
        ].map((field, index) => {
          const isLast = index === 5;
          return (
            <div
              key={index}
              className={`
                flex gap-2 items-center justify-center w-full text-base leading-6 text-white shrink-0
                ${!isLast ? 'border-b border-white/16 pb-4' : ''}
              `}
            >
              <p className="flex-1 font-['Avenir_Next',sans-serif] font-normal min-h-0 min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">
                {field.label}
              </p>
              <p className="font-['Avenir_Next',sans-serif] font-bold shrink-0">
                {field.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Ring Border */}
      <div className="absolute border border-black border-solid inset-[-8px] rounded-[40px] pointer-events-none" />
    </div>
  );
};

// Limit Modal Types
export interface LimitModalProps {
  accountLimit?: number;
  dailyLimit?: number;
  monthlyLimit?: number;
  beneficiaryLimit?: number;
  currency?: string;
  onClose?: () => void;
  className?: string;
}

// Limit Modal Component
const LimitModal: React.FC<LimitModalProps> = ({
  accountLimit = 1000000,
  dailyLimit = 50000,
  monthlyLimit = 500000,
  beneficiaryLimit = 25000,
  currency = 'NGN',
  onClose,
  className = '',
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div
      className={`
        bg-black rounded-[32px] p-10 flex flex-col gap-10 items-start relative w-full h-full
        ${className}
      `}
    >
      <div className="flex gap-4 items-start justify-center w-full shrink-0">
        <p className="flex-1 font-['Avenir_Next',sans-serif] font-semibold text-2xl leading-8 text-white whitespace-pre-wrap min-h-0 min-w-0">
          Account Limits
        </p>
        <button
          onClick={onClose}
          className="flex items-center justify-center px-0 py-1 shrink-0 hover:opacity-80 transition-opacity"
          aria-label="Close"
        >
          <div className="relative w-6 h-6 shrink-0">
            <div className="absolute inset-[18.75%]">
              <div className="absolute inset-0">
                <img alt="Close" className="block max-w-none w-full h-full" src={accountCloseIcon} />
              </div>
            </div>
          </div>
        </button>
      </div>
      <div className="flex flex-col gap-4 items-start w-full shrink-0">
        {[
          { label: 'Account Balance Limit', value: formatCurrency(accountLimit) },
          { label: 'Daily Transfer Limit', value: formatCurrency(dailyLimit) },
          { label: 'Monthly Transfer Limit', value: formatCurrency(monthlyLimit) },
          { label: 'Per-Beneficiary Limit', value: formatCurrency(beneficiaryLimit) },
        ].map((field, index) => {
          const isLast = index === 3;
          return (
            <div
              key={index}
              className={`
                flex gap-2 items-center justify-center w-full text-base leading-6 text-white shrink-0
                ${!isLast ? 'border-b border-white/16 pb-4' : ''}
              `}
            >
              <p className="flex-1 font-['Avenir_Next',sans-serif] font-normal min-h-0 min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">
                {field.label}
              </p>
              <p className="font-['Avenir_Next',sans-serif] font-bold shrink-0">
                {field.value}
              </p>
            </div>
          );
        })}
      </div>
      <div className="absolute border border-black border-solid inset-[-8px] rounded-[40px] pointer-events-none" />
    </div>
  );
};

// Transaction Aggregate Modal Types
export interface TransactionAggregateModalProps {
  totalTransferValue?: number;
  totalTransferCount?: number;
  topCategory?: string;
  period?: string;
  currency?: string;
  onClose?: () => void;
  className?: string;
}

// Transaction Aggregate Modal Component
const TransactionAggregateModal: React.FC<TransactionAggregateModalProps> = ({
  totalTransferValue = 850000,
  totalTransferCount = 24,
  topCategory = 'Food & Dining',
  period = 'This Month',
  currency = 'NGN',
  onClose,
  className = '',
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div
      className={`
        bg-black rounded-[32px] p-10 flex flex-col gap-10 items-start relative w-full h-full
        ${className}
      `}
    >
      <div className="flex gap-4 items-start justify-center w-full shrink-0">
        <p className="flex-1 font-['Avenir_Next',sans-serif] font-semibold text-2xl leading-8 text-white whitespace-pre-wrap min-h-0 min-w-0">
          Transaction Analytics
        </p>
        <button
          onClick={onClose}
          className="flex items-center justify-center px-0 py-1 shrink-0 hover:opacity-80 transition-opacity"
          aria-label="Close"
        >
          <div className="relative w-6 h-6 shrink-0">
            <div className="absolute inset-[18.75%]">
              <div className="absolute inset-0">
                <img alt="Close" className="block max-w-none w-full h-full" src={accountCloseIcon} />
              </div>
            </div>
          </div>
        </button>
      </div>
      <div className="flex flex-col gap-4 items-start w-full shrink-0">
        {[
          { label: 'Period', value: period },
          { label: 'Total Transfer Value', value: formatCurrency(totalTransferValue) },
          { label: 'Total Transfers', value: `${totalTransferCount} transactions` },
          { label: 'Top Category', value: topCategory },
        ].map((field, index) => {
          const isLast = index === 3;
          return (
            <div
              key={index}
              className={`
                flex gap-2 items-center justify-center w-full text-base leading-6 text-white shrink-0
                ${!isLast ? 'border-b border-white/16 pb-4' : ''}
              `}
            >
              <p className="flex-1 font-['Avenir_Next',sans-serif] font-normal min-h-0 min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">
                {field.label}
              </p>
              <p className="font-['Avenir_Next',sans-serif] font-bold shrink-0">
                {field.value}
              </p>
            </div>
          );
        })}
      </div>
      <div className="absolute border border-black border-solid inset-[-8px] rounded-[40px] pointer-events-none" />
    </div>
  );
};

// Virtual Card Modal Types
export interface VirtualCardModalProps {
  cardLabel?: string;
  cardNumber?: string;
  spendLimit?: number;
  spendPeriod?: string;
  expiresAt?: string;
  currency?: string;
  onClose?: () => void;
  className?: string;
}

// Virtual Card Modal Component
const VirtualCardModal: React.FC<VirtualCardModalProps> = ({
  cardLabel = 'Shopping Card',
  cardNumber = '**** **** **** 1234',
  spendLimit = 100000,
  spendPeriod = 'Monthly',
  expiresAt = '2025-12-31',
  currency = 'NGN',
  onClose,
  className = '',
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div
      className={`
        bg-black rounded-[32px] p-10 flex flex-col gap-10 items-start relative w-full h-full
        ${className}
      `}
    >
      <div className="flex gap-4 items-start justify-center w-full shrink-0">
        <p className="flex-1 font-['Avenir_Next',sans-serif] font-semibold text-2xl leading-8 text-white whitespace-pre-wrap min-h-0 min-w-0">
          Virtual Card
        </p>
        <button
          onClick={onClose}
          className="flex items-center justify-center px-0 py-1 shrink-0 hover:opacity-80 transition-opacity"
          aria-label="Close"
        >
          <div className="relative w-6 h-6 shrink-0">
            <div className="absolute inset-[18.75%]">
              <div className="absolute inset-0">
                <img alt="Close" className="block max-w-none w-full h-full" src={accountCloseIcon} />
              </div>
            </div>
          </div>
        </button>
      </div>
      <div className="flex flex-col gap-4 items-start w-full shrink-0">
        {[
          { label: 'Card Label', value: cardLabel },
          { label: 'Card Number', value: cardNumber },
          { label: 'Spend Limit', value: formatCurrency(spendLimit) },
          { label: 'Spend Period', value: spendPeriod },
          { label: 'Expires', value: formatDate(expiresAt) },
        ].map((field, index) => {
          const isLast = index === 4;
          return (
            <div
              key={index}
              className={`
                flex gap-2 items-center justify-center w-full text-base leading-6 text-white shrink-0
                ${!isLast ? 'border-b border-white/16 pb-4' : ''}
              `}
            >
              <p className="flex-1 font-['Avenir_Next',sans-serif] font-normal min-h-0 min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">
                {field.label}
              </p>
              <p className="font-['Avenir_Next',sans-serif] font-bold shrink-0">
                {field.value}
              </p>
            </div>
          );
        })}
      </div>
      <div className="absolute border border-black border-solid inset-[-8px] rounded-[40px] pointer-events-none" />
    </div>
  );
};

// Account Information Modal Types
export interface AccountInfoField {
  label: string;
  value: string;
}

export interface AccountInformationModalProps {
  fields?: AccountInfoField[];
  title?: string;
  onClose?: () => void;
  className?: string;
}

// Account Information Modal Component
const AccountInformationModal: React.FC<AccountInformationModalProps> = ({
  fields = [
    { label: 'Amount', value: '$100' },
    { label: 'Account number', value: '1234567890' },
    { label: 'Bank name', value: 'Chase Bank' },
    { label: 'Name', value: 'Michael David Wayner' },
  ],
  title = 'Account information',
  onClose,
  className = '',
}) => {
  return (
    <div
      className={`
        bg-black rounded-[32px] p-10 flex flex-col gap-10 items-start relative w-full h-full
        ${className}
      `}
    >
      {/* Title Bar */}
      <div className="flex gap-4 items-start justify-center w-full shrink-0">
        <p className="flex-1 font-['Avenir_Next',sans-serif] font-semibold text-2xl leading-8 text-white whitespace-pre-wrap min-h-0 min-w-0">
          {title}
        </p>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="flex items-center justify-center px-0 py-1 shrink-0 hover:opacity-80 transition-opacity"
          aria-label="Close"
        >
          <div className="relative w-6 h-6 shrink-0">
            <div className="absolute inset-[18.75%]">
              <div className="absolute inset-0">
                <img
                  alt="Close"
                  className="block max-w-none w-full h-full"
                  src={accountCloseIcon}
                />
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Form Fields */}
      <div className="flex flex-col gap-4 items-start w-full shrink-0">
        {fields.map((field, index) => {
          const isLast = index === fields.length - 1;
          return (
            <div
              key={index}
              className={`
                flex gap-2 items-center justify-center w-full text-base leading-6 text-white shrink-0
                ${!isLast ? 'border-b border-white/16 pb-4' : ''}
              `}
            >
              <p className="flex-1 font-['Avenir_Next',sans-serif] font-normal min-h-0 min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">
                {field.label}
              </p>
              <p className="font-['Avenir_Next',sans-serif] font-bold shrink-0">
                {field.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Ring Border */}
      <div className="absolute border border-black border-solid inset-[-8px] rounded-[40px] pointer-events-none" />
    </div>
  );
};

interface GenerativeUXProps {
  userPrompt?: string;
  headingText?: string;
  showUserPrompt?: boolean;
}

const GenerativeUX: React.FC<GenerativeUXProps> = ({
  userPrompt = "User's prompt appears here",
  headingText = "What would you like to do today?",
  showUserPrompt = true,
}) => {
  const [showJsonDetails, setShowJsonDetails] = useState(false);
  const [widgetDrawerOpen, setWidgetDrawerOpen] = useState(false);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  
  // Widget state management
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarVariant, setSidebarVariant] = useState<SidebarVariant>('save-beneficiary');

  // Demo tool execution state
  const [demoToolExecutions, setDemoToolExecutions] = useState<any[]>([]);
  const [demoPendingToolCall, setDemoPendingToolCall] = useState<any>(null);
  const [demoWidgetDrawerOpen, setDemoWidgetDrawerOpen] = useState(false);

  // Rotating example prompts
  const examplePrompts = [
    "\"Check how much I spent on food last month\"",
    "\"See my upcoming bill payments\"",
    "\"Send $100 to John Doe\""
  ];

  // Rotate through prompts every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPromptIndex((prevIndex) => (prevIndex + 1) % examplePrompts.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const {
    isConnected,
    isConnecting,
    isSpeaking,
    error,
    messages,
    aiStatus,
    currentTranscript,
    toolExecutions,
    pendingToolCall,
    approveTool,
    rejectTool,
    connect,
    disconnect,
  } = useOpenAIVoiceAgent({
    instructions: "You are Moniewave, a helpful financial assistant. Be concise and friendly.",
    name: "Moniewave",
    });

  const handleConnect = async () => {
    await connect();
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  // Automatically open drawer when widgets are available
  useEffect(() => {
    const hasWidgets = toolExecutions.some(execution => execution.widget);
    if (hasWidgets) {
      setWidgetDrawerOpen(true);
    }
  }, [toolExecutions]);
  
  // Automatically show sidebar when certain tools are executed (demo behavior)
  useEffect(() => {
    if (toolExecutions.length > 0) {
      const latestExecution = toolExecutions[toolExecutions.length - 1];
      
      // Show save beneficiary for payment tools
      if (latestExecution.toolName === 'pay_contractors_bulk' || 
          latestExecution.toolName === 'set_beneficiary_transfer_limit') {
        setSidebarVariant('save-beneficiary');
        setShowSidebar(true);
      }
      // Show account info for account-related tools
      else if (latestExecution.toolName === 'account_snapshot' || 
               latestExecution.toolName === 'set_account_limits') {
        setSidebarVariant('account-info');
        setShowSidebar(true);
      }
    }
  }, [toolExecutions]);

  // Demo tool execution functions
  const executeDemoTool = (toolName: string, args: any) => {
    const mockEvent = {
      name: toolName,
      arguments: JSON.stringify(args)
    };
    
    setDemoPendingToolCall({
      event: mockEvent,
      resolve: (approved: boolean) => {
        setDemoPendingToolCall(null);
        if (approved) {
          const execution = {
            id: `demo-${Date.now()}`,
            toolName,
            arguments: args,
            result: { status: 'success', message: `${toolName} executed successfully` },
            timestamp: new Date().toISOString(),
            widget: generateDemoWidget(toolName, args)
          };
          setDemoToolExecutions(prev => [...prev, execution]);
          setDemoWidgetDrawerOpen(true);
        }
      }
    });
  };

  const generateDemoWidget = (toolName: string, args: any) => {
    // Return the widget specification that maps to our modal components
    return {
      type: 'DemoWidget',
      toolName,
      args
    };
  };

  const approveDemoTool = () => {
    if (demoPendingToolCall) {
      demoPendingToolCall.resolve(true);
    }
  };

  const rejectDemoTool = () => {
    if (demoPendingToolCall) {
      demoPendingToolCall.resolve(false);
    }
  };

  // Automatically open drawer when widgets are available
  useEffect(() => {
    const hasWidgets = demoToolExecutions.length > 0;
    if (hasWidgets) {
      setDemoWidgetDrawerOpen(true);
    }
  }, [demoToolExecutions]);

  return (
    <div className="w-full h-full min-h-screen flex items-center justify-center bg-white">
      {/* Widget Sidebar - Slides in from right */}
      <div 
        className={`
          fixed right-0 top-0 h-full z-40 transition-transform duration-500 ease-out
          ${showSidebar ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="h-full flex items-center justify-end p-8">
{(() => {
            switch (sidebarVariant) {
              case 'save-beneficiary':
                return (
                  <Sidebar
                    variant="save-beneficiary"
                    fields={[
                      { label: 'Name', value: 'Michael David Wayner' },
                      { label: 'Bank', value: 'Chase Bank' },
                      { label: 'Account Number', value: '****7890' },
                      { label: 'Last Transfer', value: '$250.00' },
                      { label: 'Total Sent', value: '$1,450.00' },
                    ]}
                    onClose={() => setShowSidebar(false)}
                    className="max-w-md w-96 shadow-2xl"
                  />
                );
              case 'account-info':
                return (
                  <AccountInformationModal
                    fields={[
                      { label: 'Balance', value: '$720,000' },
                      { label: 'Account Number', value: '0123456789' },
                      { label: 'Bank Name', value: 'First Bank' },
                      { label: 'Account Name', value: 'Moniewave Demo' },
                    ]}
                    onClose={() => setShowSidebar(false)}
                    className="max-w-md w-96 shadow-2xl"
                  />
                );
              case 'receipt':
                return (
                  <div className="max-w-md w-96 shadow-2xl h-full">
                    <ReceiptModal
                      amount="$150"
                      accountNumber="1234567890"
                      bankName="Chase Bank"
                      recipientName="Michael David Wayner"
                      onClose={() => setShowSidebar(false)}
                      onShare={() => console.log('Share receipt')}
                      onDownload={() => console.log('Download receipt')}
                    />
                  </div>
                );
              case 'account-snapshot':
                return (
                  <div className="max-w-md w-96 shadow-2xl h-full">
                    <AccountSnapshotModal
                      onClose={() => setShowSidebar(false)}
                    />
                  </div>
                );
              case 'payment-summary':
                return (
                  <div className="max-w-md w-96 shadow-2xl h-full">
                    <PaymentSummaryModal
                      onClose={() => setShowSidebar(false)}
                    />
                  </div>
                );
              case 'invoice':
                return (
                  <div className="max-w-md w-96 shadow-2xl h-full">
                    <InvoiceModal
                      onClose={() => setShowSidebar(false)}
                    />
                  </div>
                );
              case 'limit':
                return (
                  <div className="max-w-md w-96 shadow-2xl h-full">
                    <LimitModal
                      onClose={() => setShowSidebar(false)}
                    />
                  </div>
                );
              case 'transaction-aggregate':
                return (
                  <div className="max-w-md w-96 shadow-2xl h-full">
                    <TransactionAggregateModal
                      onClose={() => setShowSidebar(false)}
                    />
                  </div>
                );
              case 'virtual-card':
                return (
                  <div className="max-w-md w-96 shadow-2xl h-full">
                    <VirtualCardModal
                      onClose={() => setShowSidebar(false)}
                    />
                  </div>
                );
              default:
                return null;
            }
          })()}
        </div>
      </div>
      
      {/* Semi-transparent backdrop when sidebar is open */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 transition-opacity duration-300"
          onClick={() => setShowSidebar(false)}
        />
      )}
      
      {/* Conversation Sidebar - Fixed Position */}
      {messages.length > 0 && (
        <div className="fixed left-0 top-1/2 -translate-y-1/2 w-80 max-h-96 p-4 overflow-y-auto">
          <div className="space-y-2">
            {messages.slice(-5).map((message, index) => (
              <ConversationMessage
                key={index}
                role={message.role}
                content={message.content}
              />
            ))}
          </div>
        </div>
      )}
      {/* Desktop Layout */}
      <div className="hidden md:flex w-full h-full flex-col gap-10 items-center justify-center p-[120px]">
        {/* Visualizer */}
        <div className="relative w-[200px] h-[200px] shrink-0 flex items-center justify-center">
          <VoiceOrbFixed isActive={isConnected} isSpeaking={isSpeaking} />
        </div>

        {/* Texts */}
        <div className="flex flex-col gap-4 items-center w-full max-w-[240px] text-center text-black">
          <div className="h-[64px] flex items-center justify-center w-full overflow-hidden relative">
            <p className="font-['Avenir_Next',sans-serif] font-semibold text-[24px] leading-[32px] max-w-[200px] w-full text-center break-words overflow-hidden">
              {headingText}
            </p>
          </div>
          <div className="h-[48px] flex items-center justify-center w-full">
            <p className="font-['Avenir_Next',sans-serif] italic text-[16px] leading-[24px] w-full whitespace-pre-wrap">
              {isConnected ? (aiStatus || "Ready") : examplePrompts[currentPromptIndex]}
            </p>
          </div>
        </div>


        {/* Icons */}
        <div className="flex gap-4 items-start">
          {/* Microphone Button */}
          <button
            onClick={isConnected ? handleDisconnect : handleConnect}
            disabled={isConnecting}
            className={`flex items-center p-4 rounded-[56px] shrink-0 transition-colors duration-200 cursor-pointer ${
              isConnected
                ? "bg-red-500/40 hover:bg-red-500/50"
                : "bg-black/40 hover:bg-black/50"
            } ${isConnecting ? "opacity-50 cursor-not-allowed" : ""}`}
            aria-label={isConnected ? "Stop voice input" : "Start voice input"}
          >
            <div className="relative w-10 h-10 shrink-0">
              <div className="absolute inset-[6.25%_18.75%_3.13%_18.75%]">
                <div className="absolute inset-0">
                  <img 
                    alt="Microphone icon" 
                    className="block max-w-none w-full h-full" 
                    src={desktopMicrophone} 
                  />
                </div>
              </div>
            </div>
          </button>

          {/* Close Button */}
          <button
            onClick={handleDisconnect}
            className="bg-black flex items-center p-4 rounded-[56px] shrink-0 hover:bg-black/90 transition-colors duration-200 cursor-pointer"
            aria-label="Close"
          >
            <div className="relative w-10 h-10 shrink-0">
              <div className="absolute inset-[18.75%]">
                <div className="absolute inset-0">
                  <img 
                    alt="Close icon" 
                    className="block max-w-none w-full h-full" 
                    src={desktopX} 
                  />
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* User Prompt */}
        {showUserPrompt && (
          <p className="font-['Avenir_Next',sans-serif] italic text-[16px] leading-[24px] max-w-[240px] min-w-full text-black text-center w-min whitespace-pre-wrap">
            {userPrompt}
          </p>
        )}
      </div>

      {/* Mobile Layout */}
      <div className="flex md:hidden w-full h-full flex-col gap-10 items-center justify-end px-10 py-20">
        {/* Texts */}
        <div className="flex flex-1 flex-col gap-4 items-center w-full max-w-[240px] text-center text-black min-h-0">
          <div className="h-[64px] flex items-center justify-center w-full overflow-hidden relative">
            <p className="font-['Avenir_Next',sans-serif] font-semibold text-[24px] leading-[32px] max-w-[200px] w-full text-center break-words overflow-hidden">
              {headingText}
            </p>
          </div>
          <div className="h-[48px] flex items-center justify-center w-full">
            <p className="font-['Avenir_Next',sans-serif] italic text-[16px] leading-[24px] w-full whitespace-pre-wrap">
              {isConnected ? (aiStatus || "Ready") : examplePrompts[currentPromptIndex]}
            </p>
          </div>
        </div>

        {/* Visualizer */}
        <div className="relative w-[200px] h-[200px] shrink-0 flex items-center justify-center">
          <VoiceOrbFixed isActive={isConnected} isSpeaking={isSpeaking} />
        </div>

        {/* Icons */}
        <div className="flex gap-4 items-start">
          {/* Microphone Button */}
          <button
            onClick={isConnected ? handleDisconnect : handleConnect}
            disabled={isConnecting}
            className={`flex items-center p-4 rounded-[56px] shrink-0 transition-colors duration-200 ${
              isConnected
                ? "bg-red-500/40 active:bg-red-500/50"
                : "bg-black/40 active:bg-black/50"
            } ${isConnecting ? "opacity-50" : ""}`}
            aria-label={isConnected ? "Stop voice input" : "Start voice input"}
          >
            <div className="relative w-10 h-10 shrink-0">
              <div className="absolute inset-[6.25%_18.75%_3.13%_18.75%]">
                <div className="absolute inset-0">
                  <img 
                    alt="Microphone icon" 
                    className="block max-w-none w-full h-full" 
                    src={mobileMicrophone} 
                  />
                </div>
              </div>
            </div>
          </button>

          {/* Close Button */}
          <button
            onClick={handleDisconnect}
            className="bg-black flex items-center p-4 rounded-[56px] shrink-0 active:bg-black/90 transition-colors duration-200"
            aria-label="Close"
          >
            <div className="relative w-10 h-10 shrink-0">
              <div className="absolute inset-[18.75%]">
                <div className="absolute inset-0">
                  <img 
                    alt="Close icon" 
                    className="block max-w-none w-full h-full" 
                    src={mobileX} 
                  />
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30">
          <span className="text-sm text-red-600">{error}</span>
        </div>
      )}

      {/* Connection Status */}
      {isConnected && (
        <div className="fixed top-8 right-8 flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-sm text-green-600">Connected</span>
        </div>
      )}
      
      {/* Demo Widget Triggers - Remove these in production */}
      <div className="fixed bottom-8 right-8 flex gap-2 z-20">
        <button
          onClick={() => {
            setSidebarVariant('save-beneficiary');
            setShowSidebar(!showSidebar);
          }}
          className="px-4 py-2 bg-black text-white rounded-lg text-xs hover:bg-black/80"
        >
          Test Save Beneficiary
        </button>
        <button
          onClick={() => {
            setSidebarVariant('account-info');
            setShowSidebar(!showSidebar);
          }}
          className="px-4 py-2 bg-black text-white rounded-lg text-xs hover:bg-black/80"
        >
          Test Account Info
        </button>
        <button
          onClick={() => {
            setSidebarVariant('receipt');
            setShowSidebar(!showSidebar);
          }}
          className="px-4 py-2 bg-black text-white rounded-lg text-xs hover:bg-black/80"
        >
          Test Receipt
        </button>
        <button
          onClick={() => {
            setSidebarVariant('account-snapshot');
            setShowSidebar(!showSidebar);
          }}
          className="px-4 py-2 bg-black text-white rounded-lg text-xs hover:bg-black/80"
        >
          Test Account Snapshot
        </button>
        <button
          onClick={() => {
            setSidebarVariant('payment-summary');
            setShowSidebar(!showSidebar);
          }}
          className="px-4 py-2 bg-black text-white rounded-lg text-xs hover:bg-black/80"
        >
          Test Payment Summary
        </button>
        <button
          onClick={() => {
            setSidebarVariant('invoice');
            setShowSidebar(!showSidebar);
          }}
          className="px-4 py-2 bg-black text-white rounded-lg text-xs hover:bg-black/80"
        >
          Test Invoice
        </button>
        <button
          onClick={() => {
            setSidebarVariant('limit');
            setShowSidebar(!showSidebar);
          }}
          className="px-4 py-2 bg-black text-white rounded-lg text-xs hover:bg-black/80"
        >
          Test Limits
        </button>
        <button
          onClick={() => {
            setSidebarVariant('transaction-aggregate');
            setShowSidebar(!showSidebar);
          }}
          className="px-4 py-2 bg-black text-white rounded-lg text-xs hover:bg-black/80"
        >
          Test Analytics
        </button>
        <button
          onClick={() => {
            setSidebarVariant('virtual-card');
            setShowSidebar(!showSidebar);
          }}
          className="px-4 py-2 bg-black text-white rounded-lg text-xs hover:bg-black/80"
        >
          Test Virtual Card
        </button>
      </div>

      {/* Demo Financial Tool Triggers */}
      <div className="fixed bottom-8 left-8 flex flex-col gap-2 z-20">
        <p className="text-xs text-gray-600 mb-2">Demo Financial Tools:</p>
        <button
          onClick={() => executeDemoTool('pay_contractors_bulk', {
            batch_reference: 'TXN123456',
            items: [
              { recipient_code: 'RCP_123', amount: 10000, reason: 'Contractor payment' }
            ]
          })}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors"
        >
          📋 Bulk Payments
        </button>
        <button
          onClick={() => executeDemoTool('account_snapshot', {
            include_balance: true,
            include_transactions: true
          })}
          className="px-3 py-2 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 transition-colors"
        >
          📊 Account Snapshot
        </button>
        <button
          onClick={() => executeDemoTool('send_invoice', {
            customer: {
              name: 'Michael David Wayner',
              email: 'michael@example.com'
            },
            line_items: [
              { name: 'Consulting Services', amount: 250000 }
            ]
          })}
          className="px-3 py-2 bg-purple-600 text-white rounded-lg text-xs hover:bg-purple-700 transition-colors"
        >
          📄 Send Invoice
        </button>
        <button
          onClick={() => executeDemoTool('set_account_limits', {
            daily_transfer_limit: 50000,
            monthly_transfer_limit: 500000
          })}
          className="px-3 py-2 bg-orange-600 text-white rounded-lg text-xs hover:bg-orange-700 transition-colors"
        >
          🔒 Set Limits
        </button>
        <button
          onClick={() => executeDemoTool('aggregate_transactions', {
            start_date: '2024-01-01',
            end_date: '2024-11-16',
            group_by: 'month'
          })}
          className="px-3 py-2 bg-teal-600 text-white rounded-lg text-xs hover:bg-teal-700 transition-colors"
        >
          📈 Analytics
        </button>
        <button
          onClick={() => executeDemoTool('create_virtual_card', {
            label: 'Shopping Card',
            spend_limit: 100000
          })}
          className="px-3 py-2 bg-pink-600 text-white rounded-lg text-xs hover:bg-pink-700 transition-colors"
        >
          💳 Virtual Card
        </button>
      </div>

      {/* Tool Approval Dialog */}
      {pendingToolCall && (
        <AlertDialog open={!!pendingToolCall}>
          <AlertDialogContent className="max-w-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Approve Tool Execution?</AlertDialogTitle>
              <AlertDialogDescription>
                The assistant wants to execute: <strong>{pendingToolCall.event.name}</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="my-4">
              {/* Widget Preview */}
              {(() => {
                try {
                  const args = JSON.parse(pendingToolCall.event.arguments);
                  const previewWidget = generateToolPreviewWidget(
                    pendingToolCall.event.name,
                    args
                  );

                  return (
                    <div className="mb-4">
                      <WidgetRenderer
                        spec={previewWidget}
                        options={{
                          onAction: (action, ctx) => {
                            console.log('Preview widget action:', action, ctx);
                          }
                        }}
                      />
                    </div>
                  );
                } catch (err) {
                  console.error('Failed to generate preview widget:', err);
                  return null;
                }
              })()}

              {/* Collapsible JSON Details */}
              <Collapsible open={showJsonDetails} onOpenChange={setShowJsonDetails}>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${showJsonDetails ? 'rotate-180' : ''}`}
                  />
                  Show technical details
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="border rounded-md p-3 bg-gray-50">
                    <p className="text-xs font-semibold mb-2 text-gray-600">Raw Arguments:</p>
                    <pre className="text-xs p-2 bg-white rounded overflow-x-auto max-h-40">
                      {JSON.stringify(
                        JSON.parse(pendingToolCall.event.arguments),
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel onClick={rejectTool}>
                Reject
              </AlertDialogCancel>
              <AlertDialogAction onClick={approveTool}>
                Approve
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Demo Tool Approval - Right Side Drawer Style */}
      {demoPendingToolCall && (
        <>
          {/* Semi-transparent backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 z-30 transition-opacity duration-300"
            onClick={rejectDemoTool}
          />
          
          {/* Tool Approval Sidebar - Slides in from right */}
          <div className="fixed right-0 top-0 h-full z-40 transition-transform duration-500 ease-out translate-x-0">
            <div className="h-full flex items-center justify-end p-8">
              <div className="max-w-md w-96 shadow-2xl h-full relative">
                {(() => {
                  try {
                    const args = JSON.parse(demoPendingToolCall.event.arguments);
                    
                    if (demoPendingToolCall.event.name === 'pay_contractors_bulk') {
                      return (
                        <PaymentSummaryModal
                          batchReference={args.batch_reference || 'BATCH-2024-001'}
                          totalAmount={args.items?.reduce((sum: number, item: any) => sum + item.amount, 0) || 150000}
                          recipientCount={args.items?.length || 5}
                          status="Pending Approval"
                          onClose={rejectDemoTool}
                        />
                      );
                    }
                    
                    if (demoPendingToolCall.event.name === 'account_snapshot') {
                      return <AccountSnapshotModal onClose={rejectDemoTool} />;
                    }
                    
                    if (demoPendingToolCall.event.name === 'send_invoice') {
                      return (
                        <InvoiceModal
                          customerName={args.customer?.name || 'Acme Corporation'}
                          customerEmail={args.customer?.email || 'finance@acme.com'}
                          onClose={rejectDemoTool}
                        />
                      );
                    }
                    
                    if (demoPendingToolCall.event.name === 'set_account_limits') {
                      return (
                        <LimitModal
                          dailyLimit={args.daily_transfer_limit || 50000}
                          monthlyLimit={args.monthly_transfer_limit || 500000}
                          onClose={rejectDemoTool}
                        />
                      );
                    }
                    
                    if (demoPendingToolCall.event.name === 'aggregate_transactions') {
                      return <TransactionAggregateModal onClose={rejectDemoTool} />;
                    }
                    
                    if (demoPendingToolCall.event.name === 'create_virtual_card') {
                      return (
                        <VirtualCardModal
                          cardLabel={args.label || 'Shopping Card'}
                          spendLimit={args.spend_limit || 100000}
                          onClose={rejectDemoTool}
                        />
                      );
                    }
                    
                    // Fallback for unknown tools
                    return (
                      <div className="bg-black rounded-[32px] p-10 h-full flex flex-col items-center justify-center">
                        <p className="text-white text-lg">Unknown tool: {demoPendingToolCall.event.name}</p>
                        <button
                          onClick={rejectDemoTool}
                          className="mt-4 px-4 py-2 bg-white text-black rounded hover:bg-gray-200"
                        >
                          Close
                        </button>
                      </div>
                    );
                  } catch (err) {
                    console.error('Failed to render demo tool preview:', err);
                    return (
                      <div className="bg-black rounded-[32px] p-10 h-full flex flex-col items-center justify-center">
                        <p className="text-white">Preview not available</p>
                        <button
                          onClick={rejectDemoTool}
                          className="mt-4 px-4 py-2 bg-white text-black rounded hover:bg-gray-200"
                        >
                          Close
                        </button>
                      </div>
                    );
                  }
                })()}
                
                {/* Approve/Reject Buttons at Bottom */}
                <div className="absolute bottom-8 left-10 right-10 flex gap-4">
                  <button
                    onClick={rejectDemoTool}
                    className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={approveDemoTool}
                    className="flex-1 px-4 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Approve
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Widget Drawer - Right Side for displaying tool execution widgets */}
      <WidgetDrawer
        open={widgetDrawerOpen}
        onOpenChange={setWidgetDrawerOpen}
      >
        {toolExecutions
          .filter(execution => execution.widget)
          .slice(-1) // Show only the latest widget
          .map((execution) => {
            // Map tool names to our styled modal components
            const toolName = execution.widget?.metadata?.toolName || execution.toolName;
            
            try {
              const args = execution.arguments || {};
              
              if (toolName === 'pay_contractors_bulk') {
                return (
                  <PaymentSummaryModal
                    key={execution.id}
                    batchReference={args.batch_reference || 'BATCH-2024-001'}
                    totalAmount={args.items?.reduce((sum: number, item: any) => sum + item.amount, 0) || 150000}
                    recipientCount={args.items?.length || 5}
                    status="Completed"
                    onClose={() => setWidgetDrawerOpen(false)}
                  />
                );
              }
              
              if (toolName === 'account_snapshot') {
                return (
                  <AccountSnapshotModal
                    key={execution.id}
                    onClose={() => setWidgetDrawerOpen(false)}
                  />
                );
              }
              
              if (toolName === 'send_invoice') {
                return (
                  <InvoiceModal
                    key={execution.id}
                    customerName={args.customer?.name || 'Acme Corporation'}
                    customerEmail={args.customer?.email || 'finance@acme.com'}
                    onClose={() => setWidgetDrawerOpen(false)}
                  />
                );
              }
              
              if (toolName === 'set_account_limits') {
                return (
                  <LimitModal
                    key={execution.id}
                    dailyLimit={args.daily_transfer_limit || 50000}
                    monthlyLimit={args.monthly_transfer_limit || 500000}
                    onClose={() => setWidgetDrawerOpen(false)}
                  />
                );
              }
              
              if (toolName === 'aggregate_transactions') {
                return (
                  <TransactionAggregateModal
                    key={execution.id}
                    onClose={() => setWidgetDrawerOpen(false)}
                  />
                );
              }
              
              if (toolName === 'create_virtual_card') {
                return (
                  <VirtualCardModal
                    key={execution.id}
                    cardLabel={args.label || 'Shopping Card'}
                    spendLimit={args.spend_limit || 100000}
                    onClose={() => setWidgetDrawerOpen(false)}
                  />
                );
              }
              
              // Fallback to original WidgetRenderer for unrecognized tools
              return (
                <div key={execution.id} className="bg-gray-100 p-4 rounded-lg">
                  <WidgetRenderer
                    spec={execution.widget!}
                    options={{
                      onAction: (action, ctx) => {
                        console.log('Widget action:', action, ctx);
                        if (action.type === 'expand') {
                          console.log('Expand widget');
                        }
                      }
                    }}
                  />
                </div>
              );
            } catch (err) {
              console.error('Failed to render styled widget:', err);
              // Fallback to original WidgetRenderer
              return (
                <div key={execution.id} className="bg-gray-100 p-4 rounded-lg">
                  <WidgetRenderer
                    spec={execution.widget!}
                    options={{
                      onAction: (action, ctx) => {
                        console.log('Widget action:', action, ctx);
                      }
                    }}
                  />
                </div>
              );
            }
          })}
      </WidgetDrawer>

      {/* Demo Widget Drawer - Bottom Sheet for displaying executed demo widgets */}
      <WidgetDrawer
        open={demoWidgetDrawerOpen}
        onOpenChange={setDemoWidgetDrawerOpen}
      >
        <div className="space-y-4">
          {demoToolExecutions
            .slice(-3) // Show last 3 widgets
            .map((execution) => (
              <div key={execution.id} className="bg-gray-100 p-4 rounded-lg">
                {execution.toolName === 'pay_contractors_bulk' && (
                  <div className="max-w-md mx-auto">
                    <PaymentSummaryModal
                      batchReference={execution.arguments.batch_reference || 'BATCH-2024-001'}
                      totalAmount={execution.arguments.items?.reduce((sum: number, item: any) => sum + item.amount, 0) || 150000}
                      recipientCount={execution.arguments.items?.length || 5}
                      status="Completed"
                      onClose={() => setDemoWidgetDrawerOpen(false)}
                    />
                  </div>
                )}
                {execution.toolName === 'account_snapshot' && (
                  <div className="max-w-md mx-auto">
                    <AccountSnapshotModal onClose={() => setDemoWidgetDrawerOpen(false)} />
                  </div>
                )}
                {execution.toolName === 'send_invoice' && (
                  <div className="max-w-md mx-auto">
                    <InvoiceModal
                      customerName={execution.arguments.customer?.name || 'Acme Corporation'}
                      customerEmail={execution.arguments.customer?.email || 'finance@acme.com'}
                      onClose={() => setDemoWidgetDrawerOpen(false)}
                    />
                  </div>
                )}
                {execution.toolName === 'set_account_limits' && (
                  <div className="max-w-md mx-auto">
                    <LimitModal
                      dailyLimit={execution.arguments.daily_transfer_limit || 50000}
                      monthlyLimit={execution.arguments.monthly_transfer_limit || 500000}
                      onClose={() => setDemoWidgetDrawerOpen(false)}
                    />
                  </div>
                )}
                {execution.toolName === 'aggregate_transactions' && (
                  <div className="max-w-md mx-auto">
                    <TransactionAggregateModal onClose={() => setDemoWidgetDrawerOpen(false)} />
                  </div>
                )}
                {execution.toolName === 'create_virtual_card' && (
                  <div className="max-w-md mx-auto">
                    <VirtualCardModal
                      cardLabel={execution.arguments.label || 'Shopping Card'}
                      spendLimit={execution.arguments.spend_limit || 100000}
                      onClose={() => setDemoWidgetDrawerOpen(false)}
                    />
                  </div>
                )}
              </div>
            ))}
        </div>
      </WidgetDrawer>
    </div>
  );
};

export default GenerativeUX;

// Export modal components for use in other files
export {
  AccountSnapshotModal,
  PaymentSummaryModal,
  InvoiceModal,
  LimitModal,
  TransactionAggregateModal,
  VirtualCardModal
};