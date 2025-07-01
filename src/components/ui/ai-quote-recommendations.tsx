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

interface ServiceRecommendation {
  serviceName: string
  currentPrice: number
  recommendedPrice: number
  confidenceLevel: 'high' | 'medium' | 'low'
  reasoning: string
  priceRange: {
    min: number
    max: number
  }
}

interface AIQuoteResponse {
  marketAnalysis: {
    locationFactor: string
    marketConditions: string
    competitivePosition: string
  }
  serviceRecommendations: ServiceRecommendation[]
  totalQuote: {
    currentTotal: number
    recommendedTotal: number
    confidenceLevel: 'high' | 'medium' | 'low'
    reasoning: string
  }
  negotiationTips: string[]
}

interface AIQuoteRecommendationsProps {
  aiResponse: AIQuoteResponse
  onApplyRecommendations: (recommendations: ServiceRecommendation[]) => void
  onClose: () => void
}

function getConfidenceColor(level: 'high' | 'medium' | 'low') {
  switch (level) {
    case 'high':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'low':
      return 'bg-red-100 text-red-800 border-red-200'
  }
}

function getConfidenceIcon(level: 'high' | 'medium' | 'low') {
  switch (level) {
    case 'high':
      return '✓'
    case 'medium':
      return '⚠'
    case 'low':
      return '?'
  }
}

export function AIQuoteRecommendations({
  aiResponse,
  onApplyRecommendations,
  onClose,
}: AIQuoteRecommendationsProps) {
  const handleApplyAll = () => {
    onApplyRecommendations(aiResponse.serviceRecommendations)
  }

  return (
    <div className="space-y-6">
      {/* Market Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Market Analysis</span>
            <Badge variant="outline">AI Insights</Badge>
          </CardTitle>
          <CardDescription>
            AI-powered market research and competitive analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="mb-1 text-sm font-medium">Location Factor</h4>
            <p className="text-muted-foreground text-sm">
              {aiResponse.marketAnalysis.locationFactor}
            </p>
          </div>
          <div>
            <h4 className="mb-1 text-sm font-medium">Market Conditions</h4>
            <p className="text-muted-foreground text-sm">
              {aiResponse.marketAnalysis.marketConditions}
            </p>
          </div>
          <div>
            <h4 className="mb-1 text-sm font-medium">Competitive Position</h4>
            <p className="text-muted-foreground text-sm">
              {aiResponse.marketAnalysis.competitivePosition}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Service Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Service Pricing Recommendations</CardTitle>
          <CardDescription>
            AI-suggested pricing with confidence levels and reasoning
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {aiResponse.serviceRecommendations.map((service, index) => (
            <div key={index} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{service.serviceName}</h4>
                <Badge
                  variant="outline"
                  className={getConfidenceColor(service.confidenceLevel)}
                >
                  {getConfidenceIcon(service.confidenceLevel)}{' '}
                  {service.confidenceLevel}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Current:</span>
                  <div className="font-medium">${service.currentPrice}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Recommended:</span>
                  <div className="font-medium text-green-600">
                    ${service.recommendedPrice}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Range:</span>
                  <div className="font-medium">
                    ${service.priceRange.min} - ${service.priceRange.max}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-muted-foreground text-sm">
                  Reasoning:
                </span>
                <p className="mt-1 text-sm">{service.reasoning}</p>
              </div>

              {index < aiResponse.serviceRecommendations.length - 1 && (
                <Separator />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Total Quote Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Total Quote Summary</span>
            <Badge
              variant="outline"
              className={getConfidenceColor(
                aiResponse.totalQuote.confidenceLevel,
              )}
            >
              {getConfidenceIcon(aiResponse.totalQuote.confidenceLevel)}{' '}
              {aiResponse.totalQuote.confidenceLevel} confidence
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-muted-foreground text-sm">
                Current Total:
              </span>
              <div className="text-lg font-semibold">
                ${aiResponse.totalQuote.currentTotal.toFixed(2)}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground text-sm">
                Recommended Total:
              </span>
              <div className="text-lg font-semibold text-green-600">
                ${aiResponse.totalQuote.recommendedTotal.toFixed(2)}
              </div>
            </div>
          </div>

          <div>
            <span className="text-muted-foreground text-sm">AI Reasoning:</span>
            <p className="mt-1 text-sm">{aiResponse.totalQuote.reasoning}</p>
          </div>
        </CardContent>
      </Card>

      {/* Negotiation Tips */}
      {aiResponse.negotiationTips.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Negotiation Tips</CardTitle>
            <CardDescription>
              AI-suggested strategies for client negotiations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {aiResponse.negotiationTips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 text-blue-500">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button onClick={handleApplyAll}>Apply All Recommendations</Button>
      </div>
    </div>
  )
}
