import { X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import { taxRateFromDecimal } from '@/lib/tax-utils'
import { formatCurrency } from '@/lib/utils'

interface QuotePreviewProps {
  quoteData: {
    quoteDocument: {
      executiveSummary: string
      serviceBreakdown: Array<{
        serviceName: string
        description: string
        quantity: number
        unitPrice: number
        totalPrice: number
        deliverables: string[]
      }>
      termsAndConditions: string[]
      paymentTerms: string
      deliveryTimeline: string
      nextSteps: string
    }
    presentation: {
      keyHighlights: string[]
      valueProposition: string
      competitiveAdvantages: string[]
    }
    pricing?: {
      subtotal: number
      taxEnabled: boolean
      taxRate: number
      taxAmount: number
      totalAmount: number
      currency: string
    }
  }
  currency?: string
  onClose: () => void
  versionNumber?: string
  isRevision?: boolean
  // Tax-related props (fallback for backward compatibility)
  subtotal?: number
  taxEnabled?: boolean
  taxRate?: number // decimal format (e.g., 0.0825 for 8.25%)
  taxAmount?: number
  totalAmount?: number
}

export function QuotePreview({
  quoteData,
  currency = 'USD',
  onClose,
  versionNumber,
  isRevision,
  subtotal,
  taxEnabled = false,
  taxRate = 0,
  taxAmount = 0,
  totalAmount,
}: QuotePreviewProps) {
  // Calculate values - prioritize pricing from AI response, then props, then fallback
  const serviceTotal = quoteData.quoteDocument.serviceBreakdown.reduce(
    (sum, service) => sum + service.totalPrice,
    0,
  )

  // Use pricing from AI response if available, otherwise use props or calculate
  const pricingData = quoteData.pricing
  const displaySubtotal = pricingData?.subtotal ?? subtotal ?? serviceTotal
  const displayTaxEnabled = pricingData?.taxEnabled ?? taxEnabled ?? false
  const displayTaxAmount = pricingData?.taxAmount ?? taxAmount ?? 0
  const displayTotal =
    pricingData?.totalAmount ??
    totalAmount ??
    displaySubtotal + displayTaxAmount
  const displayTaxRate = pricingData?.taxRate
    ? taxRateFromDecimal(pricingData.taxRate)
    : taxRate
      ? taxRateFromDecimal(taxRate)
      : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-row items-center justify-between gap-2">
        <div className="flex flex-col gap-1 sm:gap-2">
          <h2 className="text-2xl font-bold">Quote Preview</h2>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
            <p className="text-muted-foreground text-sm">
              AI-generated professional quote document
            </p>
            {versionNumber && (
              <Badge variant="secondary" className="w-fit text-xs">
                {isRevision
                  ? `Revision ${versionNumber}`
                  : `Version ${versionNumber}`}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Show icon button on mobile, text button on desktop */}
          <Button
            variant={'outline'}
            size={'icon'}
            onClick={onClose}
            className="text-muted-foreground hover:bg-muted focus:ring-ring inline-flex items-center justify-center rounded-md p-2 focus:ring-2 focus:outline-none sm:hidden"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="hidden sm:inline-flex"
          >
            Close
          </Button>
        </div>
      </div>

      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Executive Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {quoteData.quoteDocument.executiveSummary}
          </p>
        </CardContent>
      </Card>

      {/* Value Proposition */}
      <Card>
        <CardHeader>
          <CardTitle>Value Proposition</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {quoteData.presentation.valueProposition}
          </p>

          <div>
            <h4 className="mb-2 font-medium">Key Highlights</h4>
            <ul className="space-y-1">
              {quoteData.presentation.keyHighlights.map((highlight, index) => (
                <li
                  key={index}
                  className="text-muted-foreground flex items-start gap-2 text-sm"
                >
                  <span className="mt-0.5 text-blue-500">•</span>
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-2 font-medium">Competitive Advantages</h4>
            <ul className="space-y-1">
              {quoteData.presentation.competitiveAdvantages.map(
                (advantage, index) => (
                  <li
                    key={index}
                    className="text-muted-foreground flex items-start gap-2 text-sm"
                  >
                    <span className="mt-0.5 text-green-500">✓</span>
                    <span>{advantage}</span>
                  </li>
                ),
              )}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Service Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Service Breakdown</CardTitle>
          <CardDescription>
            Detailed breakdown of services and pricing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {quoteData.quoteDocument.serviceBreakdown.map((service, index) => (
            <div key={index} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{service.serviceName}</h4>
                <Badge variant="outline">
                  {formatCurrency(service.totalPrice, currency)}
                </Badge>
              </div>

              <p className="text-muted-foreground text-sm">
                {service.description}
              </p>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Quantity:</span>
                  <div className="font-medium">{service.quantity}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Unit Price:</span>
                  <div className="font-medium">
                    {formatCurrency(service.unitPrice, currency)}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Total:</span>
                  <div className="font-medium">
                    {formatCurrency(service.totalPrice, currency)}
                  </div>
                </div>
              </div>

              {service.deliverables.length > 0 && (
                <div>
                  <h5 className="mb-1 text-sm font-medium">Deliverables:</h5>
                  <ul className="space-y-1">
                    {service.deliverables.map((deliverable, idx) => (
                      <li
                        key={idx}
                        className="text-muted-foreground flex items-start gap-2 text-sm"
                      >
                        <span className="mt-0.5 text-blue-500">•</span>
                        <span>{deliverable}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {index < quoteData.quoteDocument.serviceBreakdown.length - 1 && (
                <Separator />
              )}
            </div>
          ))}

          {/* Investment Summary */}
          <div className="bg-muted/50 space-y-3 rounded-lg p-4">
            <h4 className="text-base font-semibold">Investment Summary</h4>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">
                  {formatCurrency(displaySubtotal, currency)}
                </span>
              </div>

              {displayTaxEnabled && displayTaxAmount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Tax ({displayTaxRate.toFixed(1)}%):
                  </span>
                  <span className="font-medium">
                    {formatCurrency(displayTaxAmount, currency)}
                  </span>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between pt-2 text-lg font-semibold">
                <span>Total Investment:</span>
                <span className="text-primary">
                  {formatCurrency(displayTotal, currency)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terms and Conditions */}
      <Card>
        <CardHeader>
          <CardTitle>Terms and Conditions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {quoteData.quoteDocument.termsAndConditions.map((term, index) => (
              <li
                key={index}
                className="text-muted-foreground flex items-start gap-2 text-sm"
              >
                <span className="mt-0.5 text-blue-500">•</span>
                <span>{term}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Payment Terms */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Terms</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {quoteData.quoteDocument.paymentTerms}
          </p>
        </CardContent>
      </Card>

      {/* Delivery Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {quoteData.quoteDocument.deliveryTimeline}
          </p>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {quoteData.quoteDocument.nextSteps}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
