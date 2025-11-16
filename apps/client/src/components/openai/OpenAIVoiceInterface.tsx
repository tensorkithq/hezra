import { useState, useEffect } from "react";
import { Mic, MicOff, X, Search } from "lucide-react";
import { useOpenAIVoiceAgent } from "./useOpenAIVoiceAgent";
import VoiceOrbFixed from "../VoiceOrbFixed";
import ConversationMessage from "../ConversationMessage";
import { WidgetRenderer } from "../widgets/WidgetRenderer";
import { WidgetDrawer } from "../widgets/WidgetDrawer";
import {
  Sidebar as UISidebar,
  SidebarContent,
  SidebarProvider,
} from "@/components/ui/sidebar";

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
        bg-black rounded-[32px] p-10 flex flex-col gap-10 items-start relative w-full h-full min-h-0
        ${className}
      `}
    >
      {/* Title Bar */}
      <div className="flex gap-4 items-start justify-center w-full shrink-0">
        <p className="flex-1 font-['Avenir_Next',sans-serif] font-semibold text-2xl leading-8 text-white whitespace-pre-wrap min-h-0 min-w-0">
          {getTitleText()}
        </p>
        
        <div className="flex gap-2 items-center">
          {/* Expand Button - Only show on mobile */}
          {onExpand && (
            <button
              onClick={onExpand}
              className="md:hidden flex items-center justify-center px-0 py-1 shrink-0 hover:opacity-80 transition-opacity"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              <div className="relative w-6 h-6 shrink-0">
                <div className="absolute inset-[18.75%]">
                  <div className="absolute inset-0">
                    <img
                      alt={isExpanded ? "Collapse" : "Expand"}
                      className="block max-w-none w-full h-full"
                      src={expandIcon}
                    />
                  </div>
                </div>
              </div>
            </button>
          )}
          
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
      </div>

      {/* Form Fields */}
      <div className={`flex flex-col gap-4 items-start w-full flex-1 min-h-0 ${isExpanded ? 'overflow-y-auto' : 'overflow-hidden'}`}>
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

// Receipt Modal Component
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
    <div className="bg-black rounded-[32px] p-10 flex flex-col gap-10 items-start relative w-full h-full">
      {/* Title Bar */}
      <div className="flex gap-4 items-start justify-center w-full shrink-0">
        <p className="flex-1 font-['Avenir_Next',sans-serif] font-semibold text-2xl leading-8 text-white whitespace-pre-wrap min-h-0 min-w-0">
          Receipt
        </p>
        <button onClick={onClose} className="flex items-center justify-center px-0 py-1 shrink-0 hover:opacity-80 transition-opacity" aria-label="Close">
          <div className="relative w-6 h-6 shrink-0">
            <div className="absolute inset-[18.75%]">
              <div className="absolute inset-0">
                <img alt="Close" className="block max-w-none w-full h-full" src={closeIcon} />
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Carousel Section */}
      <div className="flex gap-4 items-start w-full shrink-0 overflow-x-auto pb-2">
        {receiptImages.length > 0 ? (
          receiptImages.map((image, index) => (
            <div key={index} className="bg-white h-[200px] min-w-[280px] rounded-2xl shrink-0" style={{ backgroundImage: `url(${image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
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
            <div key={index} className={`flex gap-2 items-center justify-center w-full text-base leading-6 text-white shrink-0 ${!isLast ? 'border-b border-white/16 pb-4' : ''}`}>
              <p className="flex-1 font-['Avenir_Next',sans-serif] font-normal min-h-0 min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">{field.label}</p>
              <p className="font-['Avenir_Next',sans-serif] font-bold shrink-0">{field.value}</p>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 items-start w-full shrink-0">
        <button onClick={onShare} className="border border-solid border-white flex-1 flex gap-2 items-center justify-center px-6 py-4 rounded-[56px] shrink-0 min-h-0 min-w-0 hover:bg-white/10 transition-colors" aria-label="Share">
          <p className="font-['Avenir_Next',sans-serif] font-semibold text-base leading-6 text-white tracking-[0.64px] overflow-ellipsis overflow-hidden shrink-0">Share</p>
        </button>
        <button onClick={onDownload} className="bg-white flex-1 flex gap-2 items-center justify-center px-6 py-4 rounded-[56px] shrink-0 min-h-0 min-w-0 hover:bg-white/90 transition-colors" aria-label="Download">
          <p className="font-['Avenir_Next',sans-serif] font-semibold text-base leading-6 text-black tracking-[0.64px] overflow-ellipsis overflow-hidden shrink-0">Download</p>
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
  onExpand?: () => void;
  isExpanded?: boolean;
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
  onExpand,
  isExpanded = false,
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
    <div className={`bg-black rounded-[32px] p-10 flex flex-col gap-10 items-start relative w-full h-full min-h-0 ${className}`}>
      <div className="flex gap-4 items-start justify-center w-full shrink-0">
        <p className="flex-1 font-['Avenir_Next',sans-serif] font-semibold text-2xl leading-8 text-white whitespace-pre-wrap min-h-0 min-w-0">Account Overview</p>
        <div className="flex gap-2 items-center">
          {/* Expand Button - Only show on mobile */}
          {onExpand && (
            <button
              onClick={onExpand}
              className="md:hidden flex items-center justify-center px-0 py-1 shrink-0 hover:opacity-80 transition-opacity"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              <div className="relative w-6 h-6 shrink-0">
                <div className="absolute inset-[18.75%]">
                  <div className="absolute inset-0">
                    <img
                      alt={isExpanded ? "Collapse" : "Expand"}
                      className="block max-w-none w-full h-full"
                      src={expandIcon}
                    />
                  </div>
                </div>
              </div>
            </button>
          )}
          <button onClick={onClose} className="flex items-center justify-center px-0 py-1 shrink-0 hover:opacity-80 transition-opacity" aria-label="Close">
            <div className="relative w-6 h-6 shrink-0">
              <div className="absolute inset-[18.75%]">
                <div className="absolute inset-0">
                  <img alt="Close" className="block max-w-none w-full h-full" src={accountCloseIcon} />
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
      <div className={`flex flex-col gap-4 items-start w-full flex-1 min-h-0 ${isExpanded ? 'overflow-y-auto' : 'overflow-hidden'}`}>
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
            <div key={index} className={`flex gap-2 items-center justify-center w-full text-base leading-6 text-white shrink-0 ${!isLast ? 'border-b border-white/16 pb-4' : ''}`}>
              <p className="flex-1 font-['Avenir_Next',sans-serif] font-normal min-h-0 min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">{field.label}</p>
              <p className="font-['Avenir_Next',sans-serif] font-bold shrink-0">{field.value}</p>
            </div>
          );
        })}
      </div>
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
  onExpand?: () => void;
  isExpanded?: boolean;
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
  onExpand,
  isExpanded = false,
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
    <div className={`bg-black rounded-[32px] p-10 flex flex-col gap-10 items-start relative w-full h-full min-h-0 ${className}`}>
      <div className="flex gap-4 items-start justify-center w-full shrink-0">
        <p className="flex-1 font-['Avenir_Next',sans-serif] font-semibold text-2xl leading-8 text-white whitespace-pre-wrap min-h-0 min-w-0">Payment Batch</p>
        <div className="flex gap-2 items-center">
          {/* Expand Button - Only show on mobile */}
          {onExpand && (
            <button
              onClick={onExpand}
              className="md:hidden flex items-center justify-center px-0 py-1 shrink-0 hover:opacity-80 transition-opacity"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              <div className="relative w-6 h-6 shrink-0">
                <div className="absolute inset-[18.75%]">
                  <div className="absolute inset-0">
                    <img
                      alt={isExpanded ? "Collapse" : "Expand"}
                      className="block max-w-none w-full h-full"
                      src={expandIcon}
                    />
                  </div>
                </div>
              </div>
            </button>
          )}
          <button onClick={onClose} className="flex items-center justify-center px-0 py-1 shrink-0 hover:opacity-80 transition-opacity" aria-label="Close">
            <div className="relative w-6 h-6 shrink-0">
              <div className="absolute inset-[18.75%]">
                <div className="absolute inset-0">
                  <img alt="Close" className="block max-w-none w-full h-full" src={accountCloseIcon} />
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
      <div className={`flex flex-col gap-4 items-start w-full flex-1 min-h-0 ${isExpanded ? 'overflow-y-auto' : 'overflow-hidden'}`}>
        {[
          { label: 'Batch Reference', value: batchReference },
          { label: 'Total Amount', value: formatCurrency(totalAmount) },
          { label: 'Recipients', value: `${recipientCount} beneficiaries` },
          { label: 'Status', value: status },
          { label: 'Created', value: formatDate(timestamp) },
        ].map((field, index) => {
          const isLast = index === 4;
          return (
            <div key={index} className={`flex gap-2 items-center justify-center w-full text-base leading-6 text-white shrink-0 ${!isLast ? 'border-b border-white/16 pb-4' : ''}`}>
              <p className="flex-1 font-['Avenir_Next',sans-serif] font-normal min-h-0 min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">{field.label}</p>
              <p className="font-['Avenir_Next',sans-serif] font-bold shrink-0">{field.value}</p>
            </div>
          );
        })}
      </div>
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
  onExpand?: () => void;
  isExpanded?: boolean;
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
  onExpand,
  isExpanded = false,
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
    <div className={`bg-black rounded-[32px] p-10 flex flex-col gap-10 items-start relative w-full h-full min-h-0 ${className}`}>
      <div className="flex gap-4 items-start justify-center w-full shrink-0">
        <p className="flex-1 font-['Avenir_Next',sans-serif] font-semibold text-2xl leading-8 text-white whitespace-pre-wrap min-h-0 min-w-0">Invoice</p>
        <div className="flex gap-2 items-center">
          {/* Expand Button - Only show on mobile */}
          {onExpand && (
            <button
              onClick={onExpand}
              className="md:hidden flex items-center justify-center px-0 py-1 shrink-0 hover:opacity-80 transition-opacity"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              <div className="relative w-6 h-6 shrink-0">
                <div className="absolute inset-[18.75%]">
                  <div className="absolute inset-0">
                    <img
                      alt={isExpanded ? "Collapse" : "Expand"}
                      className="block max-w-none w-full h-full"
                      src={expandIcon}
                    />
                  </div>
                </div>
              </div>
            </button>
          )}
          <button onClick={onClose} className="flex items-center justify-center px-0 py-1 shrink-0 hover:opacity-80 transition-opacity" aria-label="Close">
            <div className="relative w-6 h-6 shrink-0">
              <div className="absolute inset-[18.75%]">
                <div className="absolute inset-0">
                  <img alt="Close" className="block max-w-none w-full h-full" src={accountCloseIcon} />
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
      <div className={`flex flex-col gap-4 items-start w-full flex-1 min-h-0 ${isExpanded ? 'overflow-y-auto' : 'overflow-hidden'}`}>
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
            <div key={index} className={`flex gap-2 items-center justify-center w-full text-base leading-6 text-white shrink-0 ${!isLast ? 'border-b border-white/16 pb-4' : ''}`}>
              <p className="flex-1 font-['Avenir_Next',sans-serif] font-normal min-h-0 min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">{field.label}</p>
              <p className="font-['Avenir_Next',sans-serif] font-bold shrink-0">{field.value}</p>
            </div>
          );
        })}
      </div>
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
  onExpand?: () => void;
  isExpanded?: boolean;
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
  onExpand,
  isExpanded = false,
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
    <div className={`bg-black rounded-[32px] p-10 flex flex-col gap-10 items-start relative w-full h-full min-h-0 ${className}`}>
      <div className="flex gap-4 items-start justify-center w-full shrink-0">
        <p className="flex-1 font-['Avenir_Next',sans-serif] font-semibold text-2xl leading-8 text-white whitespace-pre-wrap min-h-0 min-w-0">Account Limits</p>
        <div className="flex gap-2 items-center">
          {/* Expand Button - Only show on mobile */}
          {onExpand && (
            <button
              onClick={onExpand}
              className="md:hidden flex items-center justify-center px-0 py-1 shrink-0 hover:opacity-80 transition-opacity"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              <div className="relative w-6 h-6 shrink-0">
                <div className="absolute inset-[18.75%]">
                  <div className="absolute inset-0">
                    <img
                      alt={isExpanded ? "Collapse" : "Expand"}
                      className="block max-w-none w-full h-full"
                      src={expandIcon}
                    />
                  </div>
                </div>
              </div>
            </button>
          )}
          <button onClick={onClose} className="flex items-center justify-center px-0 py-1 shrink-0 hover:opacity-80 transition-opacity" aria-label="Close">
            <div className="relative w-6 h-6 shrink-0">
              <div className="absolute inset-[18.75%]">
                <div className="absolute inset-0">
                  <img alt="Close" className="block max-w-none w-full h-full" src={accountCloseIcon} />
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
      <div className={`flex flex-col gap-4 items-start w-full flex-1 min-h-0 ${isExpanded ? 'overflow-y-auto' : 'overflow-hidden'}`}>
        {[
          { label: 'Account Balance Limit', value: formatCurrency(accountLimit) },
          { label: 'Daily Transfer Limit', value: formatCurrency(dailyLimit) },
          { label: 'Monthly Transfer Limit', value: formatCurrency(monthlyLimit) },
          { label: 'Per-Beneficiary Limit', value: formatCurrency(beneficiaryLimit) },
        ].map((field, index) => {
          const isLast = index === 3;
          return (
            <div key={index} className={`flex gap-2 items-center justify-center w-full text-base leading-6 text-white shrink-0 ${!isLast ? 'border-b border-white/16 pb-4' : ''}`}>
              <p className="flex-1 font-['Avenir_Next',sans-serif] font-normal min-h-0 min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">{field.label}</p>
              <p className="font-['Avenir_Next',sans-serif] font-bold shrink-0">{field.value}</p>
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
  onExpand?: () => void;
  isExpanded?: boolean;
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
  onExpand,
  isExpanded = false,
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
    <div className={`bg-black rounded-[32px] p-10 flex flex-col gap-10 items-start relative w-full h-full min-h-0 ${className}`}>
      <div className="flex gap-4 items-start justify-center w-full shrink-0">
        <p className="flex-1 font-['Avenir_Next',sans-serif] font-semibold text-2xl leading-8 text-white whitespace-pre-wrap min-h-0 min-w-0">Transaction Analytics</p>
        <div className="flex gap-2 items-center">
          {/* Expand Button - Only show on mobile */}
          {onExpand && (
            <button
              onClick={onExpand}
              className="md:hidden flex items-center justify-center px-0 py-1 shrink-0 hover:opacity-80 transition-opacity"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              <div className="relative w-6 h-6 shrink-0">
                <div className="absolute inset-[18.75%]">
                  <div className="absolute inset-0">
                    <img
                      alt={isExpanded ? "Collapse" : "Expand"}
                      className="block max-w-none w-full h-full"
                      src={expandIcon}
                    />
                  </div>
                </div>
              </div>
            </button>
          )}
          <button onClick={onClose} className="flex items-center justify-center px-0 py-1 shrink-0 hover:opacity-80 transition-opacity" aria-label="Close">
            <div className="relative w-6 h-6 shrink-0">
              <div className="absolute inset-[18.75%]">
                <div className="absolute inset-0">
                  <img alt="Close" className="block max-w-none w-full h-full" src={accountCloseIcon} />
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
      <div className={`flex flex-col gap-4 items-start w-full flex-1 min-h-0 ${isExpanded ? 'overflow-y-auto' : 'overflow-hidden'}`}>
        {[
          { label: 'Period', value: period },
          { label: 'Total Transfer Value', value: formatCurrency(totalTransferValue) },
          { label: 'Total Transfers', value: `${totalTransferCount} transactions` },
          { label: 'Top Category', value: topCategory },
        ].map((field, index) => {
          const isLast = index === 3;
          return (
            <div key={index} className={`flex gap-2 items-center justify-center w-full text-base leading-6 text-white shrink-0 ${!isLast ? 'border-b border-white/16 pb-4' : ''}`}>
              <p className="flex-1 font-['Avenir_Next',sans-serif] font-normal min-h-0 min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">{field.label}</p>
              <p className="font-['Avenir_Next',sans-serif] font-bold shrink-0">{field.value}</p>
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
  onExpand?: () => void;
  isExpanded?: boolean;
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
  onExpand,
  isExpanded = false,
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
    <div className={`bg-black rounded-[32px] p-10 flex flex-col gap-10 items-start relative w-full h-full min-h-0 ${className}`}>
      <div className="flex gap-4 items-start justify-center w-full shrink-0">
        <p className="flex-1 font-['Avenir_Next',sans-serif] font-semibold text-2xl leading-8 text-white whitespace-pre-wrap min-h-0 min-w-0">Virtual Card</p>
        <div className="flex gap-2 items-center">
          {/* Expand Button - Only show on mobile */}
          {onExpand && (
            <button
              onClick={onExpand}
              className="md:hidden flex items-center justify-center px-0 py-1 shrink-0 hover:opacity-80 transition-opacity"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              <div className="relative w-6 h-6 shrink-0">
                <div className="absolute inset-[18.75%]">
                  <div className="absolute inset-0">
                    <img
                      alt={isExpanded ? "Collapse" : "Expand"}
                      className="block max-w-none w-full h-full"
                      src={expandIcon}
                    />
                  </div>
                </div>
              </div>
            </button>
          )}
          <button onClick={onClose} className="flex items-center justify-center px-0 py-1 shrink-0 hover:opacity-80 transition-opacity" aria-label="Close">
            <div className="relative w-6 h-6 shrink-0">
              <div className="absolute inset-[18.75%]">
                <div className="absolute inset-0">
                  <img alt="Close" className="block max-w-none w-full h-full" src={accountCloseIcon} />
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
      <div className={`flex flex-col gap-4 items-start w-full flex-1 min-h-0 ${isExpanded ? 'overflow-y-auto' : 'overflow-hidden'}`}>
        {[
          { label: 'Card Label', value: cardLabel },
          { label: 'Card Number', value: cardNumber },
          { label: 'Spend Limit', value: formatCurrency(spendLimit) },
          { label: 'Spend Period', value: spendPeriod },
          { label: 'Expires', value: formatDate(expiresAt) },
        ].map((field, index) => {
          const isLast = index === 4;
          return (
            <div key={index} className={`flex gap-2 items-center justify-center w-full text-base leading-6 text-white shrink-0 ${!isLast ? 'border-b border-white/16 pb-4' : ''}`}>
              <p className="flex-1 font-['Avenir_Next',sans-serif] font-normal min-h-0 min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">{field.label}</p>
              <p className="font-['Avenir_Next',sans-serif] font-bold shrink-0">{field.value}</p>
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
    <div className={`bg-black rounded-[32px] p-10 flex flex-col gap-10 items-start relative w-full h-full ${className}`}>
      <div className="flex gap-4 items-start justify-center w-full shrink-0">
        <p className="flex-1 font-['Avenir_Next',sans-serif] font-semibold text-2xl leading-8 text-white whitespace-pre-wrap min-h-0 min-w-0">{title}</p>
        <button onClick={onClose} className="flex items-center justify-center px-0 py-1 shrink-0 hover:opacity-80 transition-opacity" aria-label="Close">
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
        {fields.map((field, index) => {
          const isLast = index === fields.length - 1;
          return (
            <div key={index} className={`flex gap-2 items-center justify-center w-full text-base leading-6 text-white shrink-0 ${!isLast ? 'border-b border-white/16 pb-4' : ''}`}>
              <p className="flex-1 font-['Avenir_Next',sans-serif] font-normal min-h-0 min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">{field.label}</p>
              <p className="font-['Avenir_Next',sans-serif] font-bold shrink-0">{field.value}</p>
            </div>
          );
        })}
      </div>
      <div className="absolute border border-black border-solid inset-[-8px] rounded-[40px] pointer-events-none" />
    </div>
  );
};

const OpenAIVoiceInterface = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [widgetDrawerOpen, setWidgetDrawerOpen] = useState(false);
  const [showJsonDetails, setShowJsonDetails] = useState(false);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  
  // Widget state management
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMobileModalExpanded, setIsMobileModalExpanded] = useState(false);
  const [isWidgetDrawerExpanded, setIsWidgetDrawerExpanded] = useState(false);

  // Rotating example prompts - matching Demo.tsx exactly
  const examplePrompts = [
    "\"Check how much I spent on food last month\"",
    "\"See my upcoming bill payments\"",
    "\"Send $100 to John Doe\""
  ];

  // Rotate through prompts every 2 seconds - matching Demo.tsx exactly
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
    rawEvents,
    toolExecutions,
    pendingToolCall,
    approveTool,
    rejectTool,
    connect,
    disconnect,
  } = useOpenAIVoiceAgent({
    instructions: "You are a helpful voice assistant. Be concise and friendly.",
    name: "OpenAI Assistant",
  });

  // Reset mobile modal expanded state when modal closes
  useEffect(() => {
    if (!pendingToolCall) {
      setIsMobileModalExpanded(false);
    }
  }, [pendingToolCall]);

  // Reset widget drawer expanded state when drawer closes
  useEffect(() => {
    if (!widgetDrawerOpen) {
      setIsWidgetDrawerExpanded(false);
    }
  }, [widgetDrawerOpen]);

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

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="min-h-screen flex w-full">
        {/* Logs Sidebar - Always Visible */}
        <UISidebar 
          className={`border-r transition-all duration-300 ${sidebarOpen ? 'w-[480px]' : 'w-[12px]'}`}
          collapsible="offcanvas"
        >
          {/* <SidebarHeader className="p-4 border-b">
            <p className="text-xs text-muted-foreground">Raw events and tool executions</p>
          </SidebarHeader> */}
          
          <SidebarContent className="p-0 bg-background">
            <div className="flex flex-col h-full p-0 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-thumb]:bg-slate-400 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-slate-500">
              {/* Raw Events Section - Top Half */}
              <div className="flex-1 border-b flex flex-col">
                <div className="p-4 border-b bg-muted/30">
                  <h3 className="text-xs font-medium text-muted-foreground">raw.events</h3>
                </div>
                <div className="p-4 overflow-y-auto flex-1">
                  {rawEvents.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">
                      No events yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {rawEvents.map((event, index) => (
                        <details key={index} className="text-xs border rounded p-2" open>
                          <summary className="cursor-pointer font-medium mb-1">
                            {event.type || 'Event'} - {new Date().toLocaleTimeString()}
                          </summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                            {JSON.stringify(event, null, 2)}
                          </pre>
                        </details>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Tool Calls Section - Bottom Half */}
              <div className="flex-1 flex flex-col">
                <div className="p-4 border-b bg-muted/30">
                  <h3 className="text-xs font-medium text-muted-foreground">tool.calls</h3>
                </div>
                <div className="p-4 overflow-y-auto flex-1">
                  {toolExecutions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">
                      No tools executed yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {toolExecutions.map((execution) => (
                        <details key={execution.id} className="text-xs border rounded p-2">
                          <summary className="cursor-pointer font-medium mb-1">
                            {execution.toolName} - {new Date(execution.timestamp).toLocaleTimeString()}
                            {execution.duration && (
                              <span className="ml-2 text-primary">({execution.duration}ms)</span>
                            )}
                          </summary>
                          <div className="mt-2 space-y-2">
                            <div>
                              <strong>Arguments:</strong>
                              <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                                {JSON.stringify(execution.arguments, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <strong>Result:</strong>
                              <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                                {JSON.stringify(execution.result, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </details>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </SidebarContent>
        </UISidebar>

        {/* Main Content Area */}
        <div className="flex-1 h-screen bg-white flex flex-col items-center justify-center relative">
          {/* Desktop Layout */}
          <div className="hidden md:flex w-full h-full flex-col gap-10 items-center justify-center p-[120px]">
            {/* Visualizer */}
            <div className="relative w-[200px] h-[200px] shrink-0 flex items-center justify-center">
              <VoiceOrbFixed isActive={isConnected} isSpeaking={isSpeaking} />
            </div>

            {/* Messages Display - Below Orb */}
            {messages.length > 0 && (
              <div className="w-full max-w-xl px-8 items-center flex flex-col">
                <div className="space-y-4 w-full">
                  {messages.slice(-2).map((message, index) => (
                    <div key={index} className={index === 0 ? "font-bold" : ""}>
                      <ConversationMessage
                        role={message.role}
                        content={message.content}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Texts */}
            <div className="flex flex-col gap-4 items-center w-full max-w-[240px] text-center text-black">
              <div className="h-[64px] flex items-center justify-center w-full overflow-hidden relative">
                <p className="font-['Avenir_Next',sans-serif] font-semibold text-[24px] leading-[32px] max-w-[200px] w-full text-center break-words overflow-hidden">
                  What would you like to do today?
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
              {/* Microphone Button - Only show when disconnected */}
              {!isConnected && (
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className={`flex items-center p-4 rounded-[56px] shrink-0 transition-colors duration-200 cursor-pointer bg-black hover:bg-black/90 ${
                    isConnecting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  aria-label="Start voice input"
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
              )}

              {/* Close Button - Only show when connected */}
              {isConnected && (
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
              )}
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="flex md:hidden w-full h-full flex-col items-center justify-center px-6 py-4 relative">
            {/* Texts - At Top */}
            <div className="absolute top-16 left-6 right-6 flex flex-col gap-3 items-center text-center text-black">
              <div className="h-[64px] flex items-center justify-center w-full overflow-hidden relative">
                <p className="font-['Avenir_Next',sans-serif] font-semibold text-[24px] leading-[32px] max-w-[200px] w-full text-center break-words overflow-hidden">
                  {currentTranscript || "What would you like to do today?"}
                </p>
              </div>
              <div className="h-[48px] flex items-center justify-center w-full">
                <p className="font-['Avenir_Next',sans-serif] italic text-[16px] leading-[24px] max-w-[240px] text-center whitespace-pre-wrap">
                  {isConnected ? (aiStatus || "Ready") : examplePrompts[currentPromptIndex]}
                </p>
              </div>
            </div>

            {/* Bubble - Directly Above Icons */}
            <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 flex items-center justify-center">
              <div className="relative w-[200px] h-[200px] shrink-0 flex items-center justify-center">
                <VoiceOrbFixed isActive={isConnected} isSpeaking={isSpeaking} />
              </div>
            </div>

            {/* Icons - At Bottom, Smaller */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 items-start z-10">
              {/* Microphone Button - Only show when disconnected */}
              {!isConnected && (
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className={`flex items-center p-3 rounded-[56px] shrink-0 transition-colors duration-200 bg-black active:bg-black/90 ${
                    isConnecting ? "opacity-50" : ""
                  }`}
                  aria-label="Start voice input"
                >
                  <div className="relative w-8 h-8 shrink-0">
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
              )}

              {/* Close Button - Only show when connected */}
              {isConnected && (
                <button
                  onClick={handleDisconnect}
                  className="bg-black flex items-center p-3 rounded-[56px] shrink-0 active:bg-black/90 transition-colors duration-200"
                  aria-label="Close"
                >
                  <div className="relative w-8 h-8 shrink-0">
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
              )}
            </div>

            {/* Messages Display - Above Icons */}
            {messages.length > 0 && (
              <div className="absolute bottom-24 left-6 right-6 flex items-end justify-center">
                <div className="w-full max-w-xl">
                  <div className="space-y-2 w-full">
                    {messages.slice(-2).map((message, index) => (
                      <div key={index} className={index === 0 ? "font-bold" : ""}>
                        <ConversationMessage
                          role={message.role}
                          content={message.content}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Status Indicator */}
          {isConnected && (
            <div className="absolute top-8 right-8 flex items-center gap-1 md:gap-2 px-2 py-1 md:px-4 md:py-2 rounded-full bg-green-500/10 border border-green-500/30">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500" />
              <span className="text-xs md:text-sm text-green-600">Connected</span>
            </div>
          )}

          {/* Floating Show Logs Button - Bottom Left */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`fixed bottom-8 left-8 md:left-16 flex items-center px-3 py-1 rounded-[10px] shrink-0 transition-colors duration-200 cursor-pointer ${
              sidebarOpen
                ? "bg-accent text-foreground shadow-lg"
                : "bg-[#f0f0f080] hover:bg-black/90 text-white"
            }`}
            aria-label="Toggle logs"
          >
            <span className="font-['Avenir_Next',sans-serif] text-sm font-medium whitespace-nowrap text-[#aba9a9]">
              Show Logs
            </span>
          </button>

          {/* Error Display */}
          {error && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30">
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}


      {/* Tool Approval - Right Side Drawer Style */}
      {pendingToolCall && (
        <>
          {/* Semi-transparent backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 z-30 transition-opacity duration-300"
            onClick={rejectTool}
          />
          
          {/* Tool Approval Sidebar - Slides in from right on desktop, bottom on mobile */}
          <div className="fixed right-0 top-0 md:top-0 md:right-0 bottom-0 left-0 md:bottom-auto md:left-auto h-full md:h-full z-40 transition-all duration-500 ease-out translate-y-0 md:translate-y-0 md:translate-x-0">
            <div className="h-full flex items-end md:items-center justify-center md:justify-end p-4 md:p-8">
              <div className={`max-w-md w-full md:w-96 shadow-2xl relative rounded-t-[32px] md:rounded-[32px] transition-all duration-500 ease-out flex flex-col overflow-hidden ${
                isMobileModalExpanded ? 'h-full max-h-[90vh] md:max-h-full' : 'h-[60vh] max-h-[60vh] md:h-full md:max-h-full'
              }`}>
                {(() => {
                  try {
                    const args = JSON.parse(pendingToolCall.event.arguments);
                    
                    if (pendingToolCall.event.name === 'pay_contractors_bulk') {
                      return (
                        <PaymentSummaryModal
                          batchReference={args.batch_reference || 'BATCH-2024-001'}
                          totalAmount={args.items?.reduce((sum: number, item: any) => sum + item.amount, 0) || 150000}
                          recipientCount={args.items?.length || 5}
                          status="Pending Approval"
                          onClose={rejectTool}
                          onExpand={() => setIsMobileModalExpanded(!isMobileModalExpanded)}
                          isExpanded={isMobileModalExpanded}
                        />
                      );
                    }
                    
                    if (pendingToolCall.event.name === 'account_snapshot') {
                      return <AccountSnapshotModal onClose={rejectTool} onExpand={() => setIsMobileModalExpanded(!isMobileModalExpanded)} isExpanded={isMobileModalExpanded} />;
                    }
                    
                    if (pendingToolCall.event.name === 'send_invoice') {
                      return (
                        <InvoiceModal
                          customerName={args.customer?.name || 'Acme Corporation'}
                          customerEmail={args.customer?.email || 'finance@acme.com'}
                          onClose={rejectTool}
                          onExpand={() => setIsMobileModalExpanded(!isMobileModalExpanded)}
                          isExpanded={isMobileModalExpanded}
                        />
                      );
                    }
                    
                    if (pendingToolCall.event.name === 'set_account_limits') {
                      return (
                        <LimitModal
                          dailyLimit={args.daily_transfer_limit || 50000}
                          monthlyLimit={args.monthly_transfer_limit || 500000}
                          onClose={rejectTool}
                          onExpand={() => setIsMobileModalExpanded(!isMobileModalExpanded)}
                          isExpanded={isMobileModalExpanded}
                        />
                      );
                    }
                    
                    if (pendingToolCall.event.name === 'aggregate_transactions') {
                      return <TransactionAggregateModal onClose={rejectTool} onExpand={() => setIsMobileModalExpanded(!isMobileModalExpanded)} isExpanded={isMobileModalExpanded} />;
                    }
                    
                    if (pendingToolCall.event.name === 'create_virtual_card') {
                      return (
                        <VirtualCardModal
                          cardLabel={args.label || 'Shopping Card'}
                          spendLimit={args.spend_limit || 100000}
                          onClose={rejectTool}
                          onExpand={() => setIsMobileModalExpanded(!isMobileModalExpanded)}
                          isExpanded={isMobileModalExpanded}
                        />
                      );
                    }
                    
                    // Fallback for unknown tools
                    return (
                      <div className="bg-black rounded-[32px] p-10 h-full flex flex-col items-center justify-center">
                        <p className="text-white text-lg">Unknown tool: {pendingToolCall.event.name}</p>
                        <button
                          onClick={rejectTool}
                          className="mt-4 px-4 py-2 bg-white text-black rounded hover:bg-gray-200"
                        >
                          Close
                        </button>
                      </div>
                    );
                  } catch (err) {
                    console.error('Failed to render tool preview:', err);
                    return (
                      <div className="bg-black rounded-[32px] p-10 h-full flex flex-col items-center justify-center">
                        <p className="text-white">Preview not available</p>
                        <button
                          onClick={rejectTool}
                          className="mt-4 px-4 py-2 bg-white text-black rounded hover:bg-gray-200"
                        >
                          Close
                        </button>
                      </div>
                    );
                  }
                })()}
                
                {/* Approve/Reject Buttons at Bottom */}
                <div className="absolute bottom-8 left-4 right-4 md:left-10 md:right-10 flex gap-4">
                  <button
                    onClick={rejectTool}
                    className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={approveTool}
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
        isExpanded={isWidgetDrawerExpanded}
        onExpand={() => setIsWidgetDrawerExpanded(!isWidgetDrawerExpanded)}
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
                    onExpand={() => setIsWidgetDrawerExpanded(!isWidgetDrawerExpanded)}
                    isExpanded={isWidgetDrawerExpanded}
                  />
                );
              }
              
              if (toolName === 'account_snapshot') {
                return (
                  <AccountSnapshotModal
                    key={execution.id}
                    onClose={() => setWidgetDrawerOpen(false)}
                    onExpand={() => setIsWidgetDrawerExpanded(!isWidgetDrawerExpanded)}
                    isExpanded={isWidgetDrawerExpanded}
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
                    onExpand={() => setIsWidgetDrawerExpanded(!isWidgetDrawerExpanded)}
                    isExpanded={isWidgetDrawerExpanded}
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
                    onExpand={() => setIsWidgetDrawerExpanded(!isWidgetDrawerExpanded)}
                    isExpanded={isWidgetDrawerExpanded}
                  />
                );
              }
              
              if (toolName === 'aggregate_transactions') {
                return (
                  <TransactionAggregateModal
                    key={execution.id}
                    onClose={() => setWidgetDrawerOpen(false)}
                    onExpand={() => setIsWidgetDrawerExpanded(!isWidgetDrawerExpanded)}
                    isExpanded={isWidgetDrawerExpanded}
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
                    onExpand={() => setIsWidgetDrawerExpanded(!isWidgetDrawerExpanded)}
                    isExpanded={isWidgetDrawerExpanded}
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


      </div>
      </div>
    </SidebarProvider>
  );
};

export default OpenAIVoiceInterface;
