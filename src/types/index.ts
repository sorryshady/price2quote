export type SubscriptionTier = 'free' | 'pro'
export type BusinessType = 'freelancer' | 'company'
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced'
export type AISummaryStatus = 'pending' | 'generating' | 'completed' | 'failed'
export type QuoteStatus =
  | 'draft'
  | 'awaiting_client'
  | 'under_revision'
  | 'revised'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'paid'
export type EmailDirection = 'inbound' | 'outbound'
export type EmailType =
  | 'quote_sent'
  | 'client_response'
  | 'follow_up'
  | 'general'

export interface User {
  id: string
  name: string | null
  email: string
  emailVerified: Date | null
  image: string | null
  subscriptionTier: SubscriptionTier
}

export interface Company {
  id: string
  userId: string
  name: string
  country: string
  businessType: BusinessType
  logoUrl?: string
  description?: string
  aiSummary?: string
  aiSummaryStatus?: AISummaryStatus
  address?: string
  phone?: string
  email?: string
  website?: string
  isArchived: boolean
  archivedAt?: Date | null
  createdAt: Date
  updatedAt: Date
  currency: string
}

export interface Service {
  id: string
  companyId: string
  name: string
  description?: string
  skillLevel: SkillLevel
  basePrice?: string
  currency: string
  createdAt: Date
  updatedAt: Date
}

// Extended type for companies with services (what the API returns)
export interface CompanyWithServices extends Company {
  services: Service[]
  gmailConnected?: boolean
  gmailEmail?: string | null
}

export interface QuoteService {
  id: string
  quoteId: string
  serviceId: string
  quantity: string
  unitPrice?: string | null
  totalPrice?: string | null
  notes?: string | null
  createdAt: Date
  service?: Service | null // Include the full service details
}

export interface Quote {
  id: string
  userId: string
  companyId: string
  projectTitle: string
  projectDescription?: string | null
  amount?: string | null
  // Tax fields
  subtotal?: string | null
  taxEnabled: boolean
  taxRate?: string | null
  taxAmount?: string | null
  currency: string
  status: QuoteStatus
  clientEmail?: string | null
  clientName?: string | null
  clientLocation?: string | null
  clientBudget?: number | null
  deliveryTimeline: string
  customTimeline?: string | null
  projectComplexity: string
  sentAt?: Date | null
  createdAt: Date
  updatedAt: Date
  quoteData?: JSON
  // Revision fields for quote editing system
  parentQuoteId?: string | null
  revisionNotes?: string | null
  clientFeedback?: string | null
  versionNumber: string
  company?: Company | null // Include the full company details
  quoteServices?: QuoteService[] // Include the selected services
}

export interface QuoteVersion {
  id: string
  originalQuoteId: string
  versionNumber: string
  revisionNotes?: string | null
  clientFeedback?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface SubscriptionFeatures {
  free: {
    maxQuotesPerMonth: number
    maxCompanies: number
    maxRevisionsPerQuote: number
    features: string[]
  }
  pro: {
    maxQuotesPerMonth: number
    maxCompanies: number
    maxRevisionsPerQuote: number
    features: string[]
  }
}

export interface EmailThread {
  id: string
  userId: string
  companyId: string
  quoteId: string
  gmailMessageId: string
  gmailThreadId?: string
  direction: EmailDirection
  fromEmail?: string
  to: string
  cc?: string
  bcc?: string
  subject: string
  body: string
  attachments?: string // JSON array of attachment filenames
  includeQuotePdf: boolean
  isRead: boolean
  gmailLabels?: string // JSON array of Gmail labels
  emailType?: EmailType
  sentAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface EmailSyncStatus {
  id: string
  companyId: string
  userId: string
  lastSyncAt?: Date
  lastMessageId?: string
  syncEnabled: boolean
  syncFrequencyMinutes: number
  createdAt: Date
  updatedAt: Date
}

export interface SyncConfig {
  enabled: boolean
  frequencyMinutes: number
  maxEmailsPerSync: number
  syncUnreadOnly: boolean
  includeLabels: string[]
  excludeLabels: string[]
}

// Dodo Payments webhook and API types
export interface SubscriptionProduct {
  activated_at: string
  payment_frequency_interval: 'Day' | 'Week' | 'Month' | 'Year'
  subscription_id: string
  product_id: string
}

export interface OneTimeProduct {
  product_id: string
  quantity: number
}

export interface UpdateSubscriptionResult {
  success: boolean
  error?: {
    message: string
    status: number
  }
}

// Webhook payload structure for Dodo Payments
export interface DodoWebhookPayload {
  type: string
  business_id?: string
  timestamp?: string
  data: {
    // Payment fields (for payment.succeeded events)
    payload_type?: 'Payment' | 'Subscription'
    payment_id?: string
    total_amount?: number
    amount?: number
    currency?: string
    status?: string
    payment_method?: string
    created_at?: string

    // Subscription fields
    subscription_id?: string
    product_id?: string
    payment_frequency_interval?: 'Day' | 'Week' | 'Month' | 'Year'
    current_period_start?: number
    current_period_end?: number

    // Customer fields
    customer?: {
      customer_id?: string
      id?: string
      email: string
      name?: string
    }

    // Product cart for one-time payments
    product_cart?: OneTimeProduct[]

    // Invoice fields (for specific invoice events)
    invoice?: {
      id: string
      subscription_id: string
      amount: number
      currency?: string
      status: string
      paid_at?: number
      invoice_pdf?: string
    }

    // Fallback fields that might be at root level
    id?: string
    customer_id?: string
  }
}
