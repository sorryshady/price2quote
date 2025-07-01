export type SubscriptionTier = 'free' | 'pro'

export interface User {
  id: string
  name: string | null
  email: string
  emailVerified: Date | null
  image: string | null
  subscriptionTier: SubscriptionTier
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