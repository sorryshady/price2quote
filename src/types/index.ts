export type SubscriptionTier = 'free' | 'pro'
export type BusinessType = 'freelancer' | 'company'
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced'
export type AISummaryStatus = 'pending' | 'generating' | 'completed' | 'failed'
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'revised'
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
  createdAt: Date
  updatedAt: Date
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
}

export interface QuoteService {
  id: string
  quoteId: string
  serviceId: string
  quantity: string
  unitPrice?: string
  totalPrice?: string
  notes?: string
  createdAt: Date
  service?: Service // Include the full service details
}

export interface Quote {
  id: string
  userId: string
  companyId: string
  projectTitle: string
  projectDescription?: string | null
  amount?: string | null
  currency: string
  status: QuoteStatus
  clientEmail?: string | null
  clientName?: string | null
  clientLocation?: string | null
  clientBudget?: number | null
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
