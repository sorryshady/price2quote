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
  }
  onClose: () => void
}

export function QuotePreview({ quoteData, onClose }: QuotePreviewProps) {
  const totalAmount = quoteData.quoteDocument.serviceBreakdown.reduce(
    (sum, service) => sum + service.totalPrice,
    0,
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Quote Preview</h2>
          <p className="text-muted-foreground">
            AI-generated professional quote document
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
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
                  ${service.totalPrice.toFixed(2)}
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
                    ${service.unitPrice.toFixed(2)}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Total:</span>
                  <div className="font-medium">
                    ${service.totalPrice.toFixed(2)}
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

          <Separator />

          <div className="flex items-center justify-between text-lg font-semibold">
            <span>Total Amount:</span>
            <span>${totalAmount.toFixed(2)}</span>
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
