// Dodo Payments Configuration
export const DODO_PRODUCTS = {
  PRO_SUBSCRIPTION: 'pdt_AFlwSC3jprwrv15npF52g', // Replace with actual product ID from Dodo dashboard
} as const

// Subscription Configuration
export const SUBSCRIPTION_CONFIG = {
  PRO_PLAN: {
    name: 'Pro Plan',
    price: 29,
    currency: 'USD',
    interval: 'month',
    features: [
      'Unlimited quotes',
      'Up to 5 companies',
      'Unlimited revisions',
      'AI-powered pricing',
      'PDF export',
      'Email integration',
      'Priority support',
    ],
  },
} as const
