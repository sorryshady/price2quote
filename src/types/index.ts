export type SubscriptionTier = 'free' | 'pro'
export type BusinessType = 'freelancer' | 'company'
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced'

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
  basePrice?: number
  currency: string
  createdAt: Date
  updatedAt: Date
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