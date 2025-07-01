export type SubscriptionTier = 'free' | 'pro'
export type BusinessType = 'freelancer' | 'company'
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced'
export type AISummaryStatus = 'pending' | 'generating' | 'completed' | 'failed'
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'revised'

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
  projectDescription?: string
  amount?: string
  currency: string
  status: QuoteStatus
  clientEmail?: string
  clientName?: string
  sentAt?: Date
  createdAt: Date
  updatedAt: Date
  company?: Company // Include the full company details
  quoteServices?: QuoteService[] // Include the selected services
}

export interface SubscriptionFeatures {
  free: {
    maxQuotesPerMonth: number
    maxCompanies: number
    features: string[]
  }
  pro: {
    maxQuotesPerMonth: number
    maxCompanies: number
    features: string[]
  }
}
