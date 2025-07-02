/* eslint-disable jsx-a11y/alt-text */
import React from 'react'

import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'

import type { Quote, QuoteService } from '@/types'

// Type for AI-generated quoteData
export type AIQuoteData = {
  quoteDocument?: {
    executiveSummary?: string
    serviceBreakdown?: Array<{
      serviceName: string
      description: string
      quantity: number
      unitPrice: number
      totalPrice: number
      deliverables: string[]
    }>
    termsAndConditions?: string[]
    paymentTerms?: string
    deliveryTimeline?: string
    nextSteps?: string
  }
  presentation?: {
    keyHighlights?: string[]
    valueProposition?: string
    competitiveAdvantages?: string[]
  }
}

// Register Nunito font (Google Fonts)

// Fallback to Helvetica
Font.register({ family: 'Helvetica', src: 'Helvetica' })

// Strictly black, white, gray palette
const BG = '#fff'
const SECTION_BG = '#f7f7f9'
const TEXT = '#222'
const TEXT_SOFT = '#444'
const TEXT_SOFT2 = '#888'
const BORDER = '#ececec'

// Create styles
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    backgroundColor: BG,
    color: TEXT,
    padding: 0,
  },
  letterhead: {
    backgroundColor: SECTION_BG,
    padding: 24,
    paddingBottom: 12,
    borderBottom: `1px solid ${BORDER}`,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  letterheadLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 48,
    height: 48,
    marginRight: 16,
    objectFit: 'contain',
    borderRadius: 8,
  },
  companyInfo: {
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 2,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 700,
    color: TEXT,
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  companyDetails: {
    fontSize: 9,
    color: TEXT_SOFT2,
    marginBottom: 1,
    letterSpacing: 0.1,
  },
  contactInfo: {
    fontSize: 9,
    color: TEXT_SOFT2,
    marginTop: 2,
    letterSpacing: 0.1,
  },
  letterheadRight: {
    alignItems: 'flex-end',
    flexDirection: 'column',
    gap: 2,
  },
  quoteTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: TEXT_SOFT,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  quoteNumber: {
    fontSize: 10,
    color: TEXT_SOFT2,
    marginBottom: 2,
  },
  date: {
    fontSize: 10,
    color: TEXT_SOFT2,
  },
  content: {
    marginTop: 32,
    marginBottom: 32,
    marginHorizontal: 48,
  },
  section: {
    backgroundColor: SECTION_BG,
    marginBottom: 18,
    padding: 24,
    borderRadius: 8,
    borderBottom: `1px solid ${BORDER}`,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: TEXT_SOFT,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  label: {
    fontWeight: 700,
    color: TEXT_SOFT,
    marginRight: 4,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  value: {
    color: TEXT,
    marginBottom: 4,
  },
  summary: {
    fontStyle: 'italic',
    color: TEXT_SOFT,
    marginBottom: 8,
  },
  serviceBlock: {
    marginBottom: 14,
    paddingBottom: 10,
    borderBottom: `1px solid ${BORDER}`,
    borderRadius: 8,
  },
  pointsSection: {
    flexDirection: 'column',
    gap: 2,
    marginBottom: 4,
  },
  serviceName: {
    fontWeight: 700,
    fontSize: 12,
    color: TEXT_SOFT,
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  serviceDesc: {
    fontSize: 10,
    color: TEXT,
    marginBottom: 2,
  },
  deliverables: {
    fontSize: 9,
    color: TEXT_SOFT2,
    marginBottom: 2,
    marginLeft: 8,
  },
  terms: {
    fontSize: 10,
    color: TEXT_SOFT,
    marginBottom: 2,
    marginLeft: 8,
  },
  highlight: {
    fontSize: 10,
    color: TEXT_SOFT,
    marginBottom: 2,
    marginLeft: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
    borderTop: `1px solid ${BORDER}`,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: TEXT_SOFT,
  },
  totalAmount: {
    fontSize: 15,
    fontWeight: 700,
    color: TEXT_SOFT,
  },
  footer: {
    textAlign: 'center',
    fontSize: 9,
    color: TEXT_SOFT2,
    marginTop: 32,
    marginBottom: 12,
    borderRadius: 8,
    marginHorizontal: 48,
  },
})

interface QuotePDFProps {
  quote: Quote
}

export function QuotePDF({ quote }: QuotePDFProps) {
  const { company, quoteData } = quote

  const aiData: AIQuoteData | undefined = quoteData
    ? typeof quoteData === 'string'
      ? JSON.parse(quoteData)
      : quoteData
    : undefined

  const formatCurrency = (
    amount: string | null | undefined,
    currency: string,
  ) => {
    if (!amount) return 'N/A'
    const numAmount = parseFloat(amount)
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(numAmount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date))
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Letterhead Header */}
        <View style={styles.letterhead}>
          <View style={styles.letterheadLeft}>
            {company?.logoUrl && (
              <Image src={company.logoUrl} style={styles.logo} />
            )}
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>
                {company?.name || 'Your Company'}
              </Text>
              <Text style={styles.companyDetails}>
                {company?.businessType || ''}
              </Text>
              {company?.address && (
                <Text style={styles.companyDetails}>{company.address}</Text>
              )}
              {company?.phone && (
                <Text style={styles.companyDetails}>
                  Phone: {company.phone}
                </Text>
              )}
              {company?.website && (
                <Text style={styles.companyDetails}>{company.website}</Text>
              )}
            </View>
          </View>
          <View style={styles.letterheadRight}>
            <Text style={styles.quoteTitle}>QUOTE</Text>
            <Text style={styles.quoteNumber}>#{quote.id.slice(0, 8)}</Text>
            <Text style={styles.date}>{formatDate(quote.createdAt)}</Text>
          </View>
        </View>

        {/* Main Content Area */}
        <View style={styles.content}>
          {/* Executive Summary (AI) */}
          {aiData?.quoteDocument?.executiveSummary && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Executive Summary</Text>
              <Text style={styles.summary}>
                {aiData.quoteDocument.executiveSummary}
              </Text>
            </View>
          )}

          {/* Service Breakdown (AI) */}
          {aiData?.quoteDocument?.serviceBreakdown && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Service Breakdown</Text>
              {aiData.quoteDocument.serviceBreakdown.map((s, i: number) => (
                <View key={i} style={styles.serviceBlock}>
                  <Text style={styles.serviceName}>{s.serviceName}</Text>
                  <Text style={styles.serviceDesc}>{s.description}</Text>
                  <Text style={styles.serviceDesc}>
                    Quantity: {s.quantity} @{' '}
                    {formatCurrency(s.unitPrice.toString(), quote.currency)}
                  </Text>
                  <Text style={styles.serviceDesc}>
                    Total:{' '}
                    {formatCurrency(s.totalPrice.toString(), quote.currency)}
                  </Text>
                  {s.deliverables && s.deliverables.length > 0 && (
                    <View>
                      <Text style={styles.label}>Deliverables:</Text>
                      {s.deliverables.map((d: string, j: number) => (
                        <Text key={j} style={styles.deliverables}>
                          - {d}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Terms & Payment (AI) */}
          {(aiData?.quoteDocument?.termsAndConditions ||
            aiData?.quoteDocument?.paymentTerms ||
            aiData?.quoteDocument?.deliveryTimeline ||
            aiData?.quoteDocument?.nextSteps) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Terms & Payment</Text>
              {aiData?.quoteDocument?.termsAndConditions && (
                <View style={styles.pointsSection}>
                  <Text style={styles.label}>Terms:</Text>
                  {aiData.quoteDocument.termsAndConditions.map(
                    (t: string, i: number) => (
                      <Text key={i} style={styles.terms}>
                        - {t}
                      </Text>
                    ),
                  )}
                </View>
              )}
              {aiData?.quoteDocument?.paymentTerms && (
                <Text style={styles.value}>
                  Payment Terms: {aiData.quoteDocument.paymentTerms}
                </Text>
              )}
              {aiData?.quoteDocument?.deliveryTimeline && (
                <Text style={styles.value}>
                  Delivery Timeline: {aiData.quoteDocument.deliveryTimeline}
                </Text>
              )}
              {aiData?.quoteDocument?.nextSteps && (
                <Text style={styles.value}>
                  Next Steps: {aiData.quoteDocument.nextSteps}
                </Text>
              )}
            </View>
          )}

          {/* Presentation (AI) */}
          {(aiData?.presentation?.keyHighlights ||
            aiData?.presentation?.valueProposition ||
            aiData?.presentation?.competitiveAdvantages) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Why Choose Us</Text>
              {aiData?.presentation?.keyHighlights && (
                <View style={styles.pointsSection}>
                  <Text style={styles.label}>Key Highlights:</Text>
                  {aiData.presentation.keyHighlights.map(
                    (h: string, i: number) => (
                      <Text key={i} style={styles.highlight}>
                        - {h}
                      </Text>
                    ),
                  )}
                </View>
              )}
              {aiData?.presentation?.valueProposition && (
                <Text style={styles.value}>
                  Value Proposition: {aiData.presentation.valueProposition}
                </Text>
              )}
              {aiData?.presentation?.competitiveAdvantages && (
                <View style={styles.pointsSection}>
                  <Text style={styles.label}>Competitive Advantages:</Text>
                  {aiData.presentation.competitiveAdvantages.map(
                    (c: string, i: number) => (
                      <Text key={i} style={styles.highlight}>
                        - {c}
                      </Text>
                    ),
                  )}
                </View>
              )}
            </View>
          )}

          {/* Fallback: Basic Info if no AI data */}
          {!aiData && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Client & Project</Text>
              <Text style={styles.value}>
                Client: {quote.clientName || 'Not specified'}
              </Text>
              <Text style={styles.value}>Project: {quote.projectTitle}</Text>
              {quote.projectDescription && (
                <Text style={styles.value}>
                  Description: {quote.projectDescription}
                </Text>
              )}
            </View>
          )}

          {/* Services List (always show) */}
          {!aiData && quote.quoteServices && quote.quoteServices.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Services</Text>
              {quote.quoteServices.map((qs: QuoteService, idx: number) => (
                <View key={qs.id || idx} style={styles.serviceBlock}>
                  <Text style={styles.serviceName}>
                    {qs.service?.name || 'Service'}
                  </Text>
                  <Text style={styles.serviceDesc}>
                    Quantity: {qs.quantity}
                  </Text>
                  <Text style={styles.serviceDesc}>
                    Unit Price: {formatCurrency(qs.unitPrice, quote.currency)}
                  </Text>
                  <Text style={styles.serviceDesc}>
                    Total: {formatCurrency(qs.totalPrice, quote.currency)}
                  </Text>
                  {qs.service?.description && (
                    <Text style={styles.serviceDesc}>
                      {qs.service.description}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Total */}
          <View style={styles.section}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalAmount}>
                {formatCurrency(quote.amount, quote.currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          This quote is valid for 30 days from the date of issue. Thank you for
          considering our services.
        </Text>
      </Page>
    </Document>
  )
}
