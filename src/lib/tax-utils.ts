export interface TaxCalculation {
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
}

/**
 * Calculate tax amounts based on subtotal and tax rate
 */
export function calculateTax(
  subtotal: number,
  taxRate: number,
): TaxCalculation {
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount

  return {
    subtotal: Number(subtotal.toFixed(2)),
    taxRate: Number(taxRate.toFixed(4)),
    taxAmount: Number(taxAmount.toFixed(2)),
    total: Number(total.toFixed(2)),
  }
}

/**
 * Calculate subtotal from services
 */
export function calculateSubtotal(
  services: Array<{
    quantity: number
    unitPrice: number
  }>,
): number {
  const subtotal = services.reduce((sum, service) => {
    return sum + service.quantity * service.unitPrice
  }, 0)

  return Number(subtotal.toFixed(2))
}

/**
 * Format tax rate for display (e.g., 8.25%)
 */
export function formatTaxRate(taxRate: number): string {
  return `${taxRate.toFixed(2)}%`
}

/**
 * Parse tax rate from percentage string (e.g., "8.25%" -> 8.25)
 */
export function parseTaxRate(taxRateString: string): number {
  const cleaned = taxRateString.replace('%', '').trim()
  const rate = parseFloat(cleaned)
  return isNaN(rate) ? 0 : rate
}

/**
 * Validate tax rate (must be between 0 and 100)
 */
export function validateTaxRate(taxRate: number): boolean {
  return taxRate >= 0 && taxRate <= 100
}

/**
 * Get tax rate as decimal for database storage (e.g., 8.25% -> 0.0825)
 */
export function taxRateToDecimal(taxRate: number): number {
  return Number((taxRate / 100).toFixed(4))
}

/**
 * Get tax rate as percentage from decimal (e.g., 0.0825 -> 8.25)
 */
export function taxRateFromDecimal(decimal: number): number {
  return Number((decimal * 100).toFixed(2))
}

/**
 * Calculate quote totals with tax
 */
export function calculateQuoteTotals(
  services: Array<{
    quantity: number
    unitPrice: number
  }>,
  taxEnabled: boolean = false,
  taxRate: number = 0,
): TaxCalculation {
  const subtotal = calculateSubtotal(services)

  if (!taxEnabled || taxRate === 0) {
    return {
      subtotal,
      taxRate: 0,
      taxAmount: 0,
      total: subtotal,
    }
  }

  return calculateTax(subtotal, taxRate)
}

/**
 * Format currency amount with tax display
 */
export function formatAmountWithTax(
  amount: number,
  currency: string,
  includesTax: boolean = false,
): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const formattedAmount = formatter.format(amount)

  if (includesTax) {
    return `${formattedAmount} (incl. tax)`
  }

  return formattedAmount
}
