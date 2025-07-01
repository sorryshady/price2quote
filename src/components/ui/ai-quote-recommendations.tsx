import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'

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
  onNegotiate: (negotiationData: {
    serviceName: string
    proposedPrice: number
    reasoning: string
  }) => Promise<void>
  onGenerateFinalQuote: (finalData: {
    services: ServiceRecommendation[]
    totalAmount: number
    notes: string
  }) => Promise<void>
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
  onNegotiate,
  onGenerateFinalQuote,
}: AIQuoteRecommendationsProps) {
  const [negotiatingService, setNegotiatingService] = useState<string | null>(
    null,
  )
  const [proposedPrice, setProposedPrice] = useState<number>(0)
  const [negotiationReasoning, setNegotiationReasoning] = useState('')
  const [isNegotiating, setIsNegotiating] = useState(false)
  const [isGeneratingFinal, setIsGeneratingFinal] = useState(false)
  const [finalNotes, setFinalNotes] = useState('')
  const [showFinalQuoteForm, setShowFinalQuoteForm] = useState(false)

  const handleApplyAll = () => {
    onApplyRecommendations(aiResponse.serviceRecommendations)
  }

  const handleStartNegotiation = (service: ServiceRecommendation) => {
    setNegotiatingService(service.serviceName)
    setProposedPrice(service.recommendedPrice)
    setNegotiationReasoning('')
  }

  const handleSubmitNegotiation = async () => {
    if (!negotiatingService || proposedPrice <= 0) return

    setIsNegotiating(true)
    try {
      await onNegotiate({
        serviceName: negotiatingService,
        proposedPrice,
        reasoning: negotiationReasoning,
      })
      setNegotiatingService(null)
      setProposedPrice(0)
      setNegotiationReasoning('')
    } catch (error) {
      console.error('Negotiation failed:', error)
    } finally {
      setIsNegotiating(false)
    }
  }

  const handleGenerateFinalQuote = async () => {
    setIsGeneratingFinal(true)
    try {
      await onGenerateFinalQuote({
        services: aiResponse.serviceRecommendations,
        totalAmount: aiResponse.totalQuote.recommendedTotal,
        notes: finalNotes,
      })
    } catch (error) {
      console.error('Final quote generation failed:', error)
    } finally {
      setIsGeneratingFinal(false)
    }
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

      {/* Service Recommendations with Negotiation */}
      <Card>
        <CardHeader>
          <CardTitle>Service Pricing Recommendations</CardTitle>
          <CardDescription>
            AI-suggested pricing with confidence levels and interactive
            negotiation
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
                  AI Reasoning:
                </span>
                <p className="mt-1 text-sm">{service.reasoning}</p>
              </div>

              {/* Negotiation Section */}
              {negotiatingService === service.serviceName ? (
                <div className="bg-muted/50 space-y-3 rounded-lg border p-4">
                  <h5 className="text-sm font-medium">
                    Negotiate Price for {service.serviceName}
                  </h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Proposed Price</Label>
                      <Input
                        type="number"
                        min={service.priceRange.min}
                        max={service.priceRange.max}
                        step="0.01"
                        value={proposedPrice}
                        onChange={(e) =>
                          setProposedPrice(parseFloat(e.target.value) || 0)
                        }
                        placeholder="Enter your proposed price"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Price Range</Label>
                      <div className="text-muted-foreground pt-2 text-sm">
                        ${service.priceRange.min} - ${service.priceRange.max}
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm">Your Reasoning</Label>
                    <Textarea
                      value={negotiationReasoning}
                      onChange={(e) => setNegotiationReasoning(e.target.value)}
                      placeholder="Explain why you want to adjust this price..."
                      className="min-h-[60px]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSubmitNegotiation}
                      disabled={isNegotiating || proposedPrice <= 0}
                    >
                      {isNegotiating ? 'Negotiating...' : 'Submit Negotiation'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setNegotiatingService(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStartNegotiation(service)}
                  >
                    Negotiate Price
                  </Button>
                </div>
              )}

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

      {/* Final Quote Generation */}
      {showFinalQuoteForm && (
        <Card>
          <CardHeader>
            <CardTitle>Generate Final Quote</CardTitle>
            <CardDescription>
              Add final notes and generate the complete quote
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm">Final Notes</Label>
              <Textarea
                value={finalNotes}
                onChange={(e) => setFinalNotes(e.target.value)}
                placeholder="Add any final notes, terms, or special conditions for this quote..."
                className="min-h-[100px]"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleGenerateFinalQuote}
                disabled={isGeneratingFinal}
              >
                {isGeneratingFinal ? 'Generating...' : 'Generate Final Quote'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowFinalQuoteForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button variant="outline" onClick={handleApplyAll}>
          Apply All Recommendations
        </Button>
        <Button onClick={() => setShowFinalQuoteForm(true)}>
          Generate Final Quote
        </Button>
      </div>
    </div>
  )
}
