// Currency conversion utility using a free exchange rate API
// We'll use exchangerate-api.com which provides free rates
import { env } from '@/env/server'

interface ExchangeRates {
  [currency: string]: number
}

interface ExchangeRateResponse {
  result: string
  base_code: string
  conversion_rates: ExchangeRates
  time_last_update_unix: number
}

// Cache for exchange rates (valid for 1 hour)
let ratesCache: {
  rates: ExchangeRates
  timestamp: number
} | null = null

const CACHE_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds

export async function getExchangeRates(): Promise<ExchangeRates> {
  // Check if we have valid cached rates
  if (ratesCache && Date.now() - ratesCache.timestamp < CACHE_DURATION) {
    return ratesCache.rates
  }

  try {
    // Using exchangerate-api.com free tier (1500 requests/month)
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${env.EXCHANGERATE_API_KEY}/latest/USD`,
      {
        next: { revalidate: 3600 }, // Cache for 1 hour
      },
    )

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates')
    }

    const data: ExchangeRateResponse = await response.json()

    if (data.result !== 'success') {
      throw new Error('Exchange rate API returned error')
    }

    // Convert to USD base rates (invert the rates since API gives USD -> other)
    const usdRates: ExchangeRates = { USD: 1 }

    Object.entries(data.conversion_rates).forEach(([currency, rate]) => {
      usdRates[currency] = 1 / rate // Convert to "how many units of this currency = 1 USD"
    })

    // Cache the rates
    ratesCache = {
      rates: usdRates,
      timestamp: Date.now(),
    }

    return usdRates
  } catch (error) {
    console.error('Error fetching exchange rates:', error)

    // Fallback rates (approximate)
    const fallbackRates: ExchangeRates = {
      USD: 1,
      EUR: 0.85,
      GBP: 0.75,
      INR: 83,
      AUD: 1.55,
      CAD: 1.35,
      JPY: 150,
    }

    return fallbackRates
  }
}

export async function convertToUSD(
  amount: number,
  fromCurrency: string,
): Promise<number> {
  if (fromCurrency === 'USD') {
    return amount
  }

  const rates = await getExchangeRates()
  const rate = rates[fromCurrency]

  if (!rate) {
    console.warn(`Exchange rate not found for ${fromCurrency}, using 1:1`)
    return amount
  }

  // Convert to USD
  return amount / rate
}

export async function getExchangeRateInfo(currency: string): Promise<{
  rate: number
  lastUpdated: Date
}> {
  const rates = await getExchangeRates()
  const rate = rates[currency] || 1

  return {
    rate,
    lastUpdated: ratesCache?.timestamp
      ? new Date(ratesCache.timestamp)
      : new Date(),
  }
}
