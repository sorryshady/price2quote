import {
  Check,
  DollarSign,
  File,
  FilePenLine,
  GitBranch,
  Mail,
  RefreshCcw,
  X,
} from 'lucide-react'

import type { QuoteStatus } from '@/types'

/**
 * Get Tailwind CSS classes for quote status badges
 */
export function getStatusColor(status: QuoteStatus): string {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    case 'awaiting_client':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'under_revision':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'revised':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'accepted':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'expired':
      return 'bg-slate-100 text-slate-800 border-slate-200'
    case 'paid':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

/**
 * Get Tailwind CSS classes for quote status badges with dark mode support
 */
export function getStatusColorWithDarkMode(status: QuoteStatus): string {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    case 'awaiting_client':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'under_revision':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    case 'revised':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    case 'accepted':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    case 'expired':
      return 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200'
    case 'paid':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  }
}

/**
 * Get icon component for quote status
 */
export function getStatusIcon(status: QuoteStatus, className = 'h-4 w-4') {
  switch (status) {
    case 'draft':
      return <File className={className} />
    case 'awaiting_client':
      return <Mail className={className} />
    case 'under_revision':
      return <FilePenLine className={className} />
    case 'revised':
      return <RefreshCcw className={className} />
    case 'accepted':
      return <Check className={className} />
    case 'rejected':
      return <X className={className} />
    case 'expired':
      return <GitBranch className={className} />
    case 'paid':
      return <DollarSign className={className} />
    default:
      return <File className={className} />
  }
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: QuoteStatus): string {
  switch (status) {
    case 'draft':
      return 'Draft'
    case 'awaiting_client':
      return 'Awaiting Client'
    case 'under_revision':
      return 'Under Revision'
    case 'revised':
      return 'Revised'
    case 'accepted':
      return 'Accepted'
    case 'rejected':
      return 'Rejected'
    case 'expired':
      return 'Expired'
    case 'paid':
      return 'Paid'
    default:
      return status
  }
}

/**
 * Check if a quote status allows editing
 */
export function isStatusEditable(status: QuoteStatus): boolean {
  return ['under_revision', 'rejected'].includes(status)
}

/**
 * Check if a quote status represents completed revenue
 */
export function isRevenueStatus(status: QuoteStatus): boolean {
  return ['accepted', 'paid'].includes(status)
}

/**
 * Get all possible quote statuses for dropdowns
 */
export const QUOTE_STATUSES: { value: QuoteStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'awaiting_client', label: 'Awaiting Client' },
  { value: 'under_revision', label: 'Under Revision' },
  { value: 'revised', label: 'Revised' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' },
  { value: 'paid', label: 'Paid' },
]

/**
 * Get status filter options for filtering UI
 */
export const STATUS_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All' },
  ...QUOTE_STATUSES,
]
