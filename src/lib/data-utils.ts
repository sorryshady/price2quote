import countryCityState from 'countrycitystatejson'
import currencyCodes from 'currency-codes'
import worldCountries from 'world-countries'

// Types for better TypeScript support
export interface CountryOption {
  code: string
  name: string
  flag?: string
}

export interface CurrencyOption {
  code: string
  name: string
  symbol?: string
  decimalDigits?: number
}

export interface StateOption {
  code: string
  name: string
}

// Popular countries that should appear first in dropdowns
const POPULAR_COUNTRIES = [
  'US',
  'CA',
  'GB',
  'AU',
  'DE',
  'FR',
  'IN',
  'JP',
  'BR',
  'MX',
  'ES',
  'IT',
  'NL',
  'SE',
]

// Popular currencies that should appear first in dropdowns
const POPULAR_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'CAD',
  'AUD',
  'JPY',
  'INR',
  'CHF',
  'CNY',
  'BRL',
]

/**
 * Get all countries with comprehensive data
 */
export function getAllCountries(): CountryOption[] {
  return worldCountries
    .filter((country) => Boolean(country.independent)) // Only independent countries
    .map((country) => ({
      code: country.cca2,
      name: country.name.common,
      flag: country.flag,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Get countries sorted with popular ones first
 */
export function getPopularCountries(): CountryOption[] {
  const allCountries = getAllCountries()
  const popularCountries = allCountries.filter((country) =>
    POPULAR_COUNTRIES.includes(country.code),
  )
  const otherCountries = allCountries.filter(
    (country) => !POPULAR_COUNTRIES.includes(country.code),
  )

  // Sort popular countries by the order defined in POPULAR_COUNTRIES
  const sortedPopular = popularCountries.sort((a, b) => {
    const aIndex = POPULAR_COUNTRIES.indexOf(a.code)
    const bIndex = POPULAR_COUNTRIES.indexOf(b.code)
    return aIndex - bIndex
  })

  return [...sortedPopular, ...otherCountries]
}

/**
 * Get all currencies with comprehensive data
 */
export function getAllCurrencies(): CurrencyOption[] {
  return currencyCodes.data
    .map((currency) => ({
      code: currency.code,
      name: currency.currency,
      decimalDigits: currency.digits,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Get currencies sorted with popular ones first
 */
export function getPopularCurrencies(): CurrencyOption[] {
  const allCurrencies = getAllCurrencies()
  const popularCurrencies = allCurrencies.filter((currency) =>
    POPULAR_CURRENCIES.includes(currency.code),
  )
  const otherCurrencies = allCurrencies.filter(
    (currency) => !POPULAR_CURRENCIES.includes(currency.code),
  )

  // Sort popular currencies by the order defined in POPULAR_CURRENCIES
  const sortedPopular = popularCurrencies.sort((a, b) => {
    const aIndex = POPULAR_CURRENCIES.indexOf(a.code)
    const bIndex = POPULAR_CURRENCIES.indexOf(b.code)
    return aIndex - bIndex
  })

  return [...sortedPopular, ...otherCurrencies]
}

/**
 * Get states/provinces for a specific country
 */
export function getStatesByCountry(countryCode: string): StateOption[] {
  try {
    const states = countryCityState.getStatesByShort(countryCode)
    if (!states || !Array.isArray(states)) {
      return []
    }

    return states
      .map((state) => ({
        code: state,
        name: state,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  } catch {
    console.warn(`No states found for country: ${countryCode}`)
    return []
  }
}

/**
 * Get comprehensive currency symbol mapping
 */
export function getCurrencySymbol(currencyCode: string): string {
  // Get symbol from world-countries data which has currency symbols
  const country = worldCountries.find(
    (c) => c.currencies && Object.keys(c.currencies).includes(currencyCode),
  )
  if (country?.currencies?.[currencyCode]?.symbol) {
    return country.currencies[currencyCode].symbol
  }
  return currencyCode
}

/**
 * Get comprehensive currency name
 */
export function getCurrencyName(currencyCode: string): string {
  const currency = currencyCodes.data.find((c) => c.code === currencyCode)
  return currency?.currency || currencyCode
}

/**
 * Get country name by code
 */
export function getCountryName(countryCode: string): string {
  const country = worldCountries.find((c) => c.cca2 === countryCode)
  return country?.name.common || countryCode
}

/**
 * Check if a country has states/provinces data available
 */
export function hasStatesData(countryCode: string): boolean {
  try {
    const states = countryCityState.getStatesByShort(countryCode)
    return Boolean(states) && Array.isArray(states) && states.length > 0
  } catch {
    return false
  }
}

/**
 * Get currency for a specific country (primary currency)
 */
export function getCountryCurrency(countryCode: string): string {
  const country = worldCountries.find((c) => c.cca2 === countryCode)
  if (country?.currencies) {
    const currencyKeys = Object.keys(country.currencies)
    return currencyKeys[0] || 'USD'
  }
  return 'USD'
}
