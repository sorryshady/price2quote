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

import { taxRateFromDecimal } from '@/lib/tax-utils'
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils'
import type { Quote } from '@/types'

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
      assumptions?: string[]
      exclusions?: string[]
    }>
    termsAndConditions?: string[]
    paymentTerms?: string
    deliveryTimeline?: string
    nextSteps?: string
    projectTimeline?: string
    assumptions?: string[]
    exclusions?: string[]
  }
  presentation?: {
    keyHighlights?: string[]
    valueProposition?: string
    competitiveAdvantages?: string[]
  }
  paymentStructure?: {
    schedule?: string
    methods?: string[]
    terms?: string
  }
}

// Register fonts
Font.register({ family: 'Helvetica', src: 'Helvetica' })

// More professional, monochromatic color palette
const COLORS = {
  primary: '#1f2937', // Dark Gray
  secondary: '#4b5563', // Medium Gray
  accent: '#111827', // Near Black for emphasis
  text: {
    primary: '#1f2937',
    secondary: '#6b7280',
    muted: '#9ca3af',
  },
  background: {
    white: '#ffffff',
  },
  border: '#e5e7eb', // A subtle border color
}

// Styles refactored for a more professional, legal-document look
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    backgroundColor: COLORS.background.white,
    color: COLORS.text.primary,
    padding: '40pt',
    paddingBottom: '60pt', // Make space for footer
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '30pt',
    borderBottom: `1pt solid ${COLORS.border}`,
    paddingBottom: '10pt',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: '35pt',
    height: '35pt',
    marginRight: '10pt',
  },
  companyInfo: {},
  companyName: {
    fontSize: '16pt',
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  companyDetails: {
    fontSize: '8pt',
    color: COLORS.secondary,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  quoteTitle: {
    fontSize: '24pt',
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  quoteDetails: {
    fontSize: '9pt',
    color: COLORS.secondary,
  },
  metaSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: '30pt',
  },
  metaColumn: {
    width: '48%',
  },
  metaTitle: {
    fontSize: '11pt',
    fontWeight: 'bold',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: '0.5pt',
    borderBottom: `1pt solid ${COLORS.border}`,
    paddingBottom: '4pt',
    marginBottom: '8pt',
  },
  metaContent: {
    fontSize: '10pt',
    color: COLORS.secondary,
    lineHeight: 1.5,
  },
  section: {
    marginBottom: '20pt',
  },
  sectionTitle: {
    fontSize: '12pt',
    fontWeight: 'bold',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: '0.5pt',
    borderBottom: `2pt solid ${COLORS.primary}`,
    paddingBottom: '5pt',
    marginBottom: '15pt',
  },
  serviceItem: {
    marginBottom: '15pt',
    paddingBottom: '15pt',
    borderBottom: `1pt solid ${COLORS.border}`,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: '5pt',
  },
  serviceName: {
    fontSize: '11pt',
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  servicePrice: {
    fontSize: '11pt',
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  serviceDescription: {
    fontSize: '10pt',
    color: COLORS.secondary,
    marginBottom: '8pt',
  },
  serviceQty: {
    fontSize: '9pt',
    color: COLORS.secondary,
  },
  deliverablesList: {
    marginTop: '8pt',
  },
  deliverableItem: {
    fontSize: '9pt',
    color: COLORS.secondary,
    lineHeight: 1.4,
    marginBottom: '2pt',
  },
  investmentSection: {
    marginTop: '20pt',
    paddingTop: '15pt',
    borderTop: `2pt solid ${COLORS.primary}`,
  },
  investmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: '6pt',
    fontSize: '10pt',
  },
  totalRow: {
    marginTop: '10pt',
    paddingTop: '10pt',
    borderTop: `1pt solid ${COLORS.secondary}`,
    fontSize: '14pt',
    fontWeight: 'bold',
  },
  totalAmount: {
    color: COLORS.accent,
  },
  termsList: {
    fontSize: '9pt',
    color: COLORS.secondary,
    lineHeight: 1.5,
  },
  termItem: {
    marginBottom: '5pt',
  },
  finalSection: {
    marginTop: '30pt',
    paddingTop: '15pt',
    borderTop: `1pt solid ${COLORS.border}`,
  },
  signatureSection: {
    marginTop: '40pt',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '200pt',
    borderBottom: `1pt solid ${COLORS.primary}`,
    height: '40pt',
  },
  signatureLabel: {
    fontSize: '9pt',
    color: COLORS.secondary,
    marginTop: '4pt',
  },
  footer: {
    position: 'absolute',
    bottom: '25pt',
    left: '40pt',
    right: '40pt',
    textAlign: 'center',
    fontSize: '8pt',
    color: COLORS.text.muted,
    borderTop: `1pt solid ${COLORS.border}`,
    paddingTop: '5pt',
  },
})

interface QuotePDFProps {
  quote: Quote
}

export function QuotePDF({ quote }: QuotePDFProps) {
  // Log the quote data for analysis as requested
  console.log('Quote data being rendered:', quote)

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
    return formatCurrencyUtil(amount, currency || 'USD')
  }

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date))
  }

  const getValidUntilDate = () => {
    const validDate = new Date(quote.createdAt || new Date())
    validDate.setDate(validDate.getDate() + 30)
    return formatDate(validDate)
  }

  const subtotal = parseFloat(quote.subtotal || quote.amount || '0')
  const taxEnabled = quote.taxEnabled || false
  const taxRatePercent = quote.taxRate
    ? taxRateFromDecimal(parseFloat(quote.taxRate))
    : 0
  const taxAmount = parseFloat(quote.taxAmount || '0')
  const totalAmount = parseFloat(quote.amount || '0')

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {company?.logoUrl && (
              <Image src={company.logoUrl} style={styles.logo} />
            )}
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>
                {company?.name || 'Your Company'}
              </Text>
              <Text style={styles.companyDetails}>{company?.address}</Text>
              <Text style={styles.companyDetails}>{company?.email}</Text>
              {company?.phone && (
                <Text style={styles.companyDetails}>{company.phone}</Text>
              )}
              {company?.website && (
                <Text style={styles.companyDetails}>{company.website}</Text>
              )}
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.quoteTitle}>QUOTE</Text>
            <Text style={styles.quoteDetails}>
              #{quote.id?.slice(0, 8).toUpperCase() || 'UNKNOWN'}
            </Text>
            <Text style={styles.quoteDetails}>
              Date: {formatDate(quote.createdAt || new Date())}
            </Text>
            <Text style={styles.quoteDetails}>
              Valid Until: {getValidUntilDate()}
            </Text>
          </View>
        </View>

        {/* Client & Project Info */}
        <View style={styles.metaSection}>
          <View style={styles.metaColumn}>
            <Text style={styles.metaTitle}>Bill To</Text>
            <Text style={styles.metaContent}>
              {quote.clientName || 'Client Name'}
              {'\n'}
              {quote.clientEmail || ''}
              {'\n'}
              {quote.clientLocation || ''}
              {quote.clientBudget &&
                `\nBudget: ${formatCurrency(
                  quote.clientBudget.toString(),
                  quote.currency || 'USD',
                )}`}
            </Text>
          </View>
          <View style={styles.metaColumn}>
            <Text style={styles.metaTitle}>Project</Text>
            <Text style={styles.metaContent}>
              {quote.projectTitle || 'Project Title'}
              {quote.projectDescription && `\n${quote.projectDescription}`}
              {'\n'}
              Timeline: {quote.deliveryTimeline?.replace('_', ' ') || 'TBD'}
              {quote.customTimeline && ` (${quote.customTimeline})`}
              {'\n'}
              Complexity: {quote.projectComplexity || 'Standard'}
            </Text>
          </View>
        </View>

        {/* Executive Summary */}
        {aiData?.quoteDocument?.executiveSummary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Executive Summary</Text>
            <Text style={styles.termsList}>
              {aiData.quoteDocument.executiveSummary}
            </Text>
          </View>
        )}

        {/* Service Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Breakdown</Text>
          {aiData?.quoteDocument?.serviceBreakdown?.map((service, index) => (
            <View key={index} style={styles.serviceItem}>
              <View style={styles.serviceHeader}>
                <Text style={styles.serviceName}>{service.serviceName}</Text>
                <Text style={styles.servicePrice}>
                  {formatCurrency(
                    service.totalPrice.toString(),
                    quote.currency || 'USD',
                  )}
                </Text>
              </View>
              <Text style={styles.serviceDescription}>
                {service.description}
              </Text>
              <Text style={styles.serviceQty}>
                Quantity: {service.quantity} ×{' '}
                {formatCurrency(
                  service.unitPrice.toString(),
                  quote.currency || 'USD',
                )}
              </Text>
              {service.deliverables && service.deliverables.length > 0 && (
                <View style={styles.deliverablesList}>
                  <Text
                    style={{
                      fontSize: '9pt',
                      color: COLORS.secondary,
                      fontWeight: 'bold',
                    }}
                  >
                    Deliverables:
                  </Text>
                  {service.deliverables.map((d, i) => (
                    <Text key={i} style={styles.deliverableItem}>
                      • {d}
                    </Text>
                  ))}
                </View>
              )}
              {service.assumptions && service.assumptions.length > 0 && (
                <View style={styles.deliverablesList}>
                  <Text
                    style={{
                      fontSize: '9pt',
                      color: COLORS.secondary,
                      fontWeight: 'bold',
                      marginTop: '4pt',
                    }}
                  >
                    Assumptions:
                  </Text>
                  {service.assumptions.map((assumption, idx) => (
                    <Text key={idx} style={styles.deliverableItem}>
                      • {assumption}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}
          {!aiData?.quoteDocument?.serviceBreakdown &&
            quote.quoteServices?.map((qs, index) => (
              <View key={qs.id || index} style={styles.serviceItem}>
                <View style={styles.serviceHeader}>
                  <Text style={styles.serviceName}>
                    {qs.service?.name || 'Service'}
                  </Text>
                  <Text style={styles.servicePrice}>
                    {formatCurrency(qs.totalPrice, quote.currency || 'USD')}
                  </Text>
                </View>
                {qs.service?.description && (
                  <Text style={styles.serviceDescription}>
                    {qs.service.description}
                  </Text>
                )}
                <Text style={styles.serviceQty}>
                  Quantity: {qs.quantity} ×{' '}
                  {formatCurrency(qs.unitPrice, quote.currency || 'USD')}
                </Text>
                {qs.notes && (
                  <Text style={styles.serviceDescription}>
                    Notes: {qs.notes}
                  </Text>
                )}
              </View>
            ))}

          {/* Investment Summary */}
          <View style={styles.investmentSection}>
            <View style={styles.investmentRow}>
              <Text>Subtotal</Text>
              <Text>
                {formatCurrency(subtotal.toString(), quote.currency || 'USD')}
              </Text>
            </View>
            {taxEnabled && taxAmount > 0 && (
              <View style={styles.investmentRow}>
                <Text>Tax ({taxRatePercent.toFixed(1)}%)</Text>
                <Text>
                  {formatCurrency(
                    taxAmount.toString(),
                    quote.currency || 'USD',
                  )}
                </Text>
              </View>
            )}
            <View style={[styles.investmentRow, styles.totalRow]}>
              <Text>Total Investment</Text>
              <Text style={styles.totalAmount}>
                {formatCurrency(
                  totalAmount.toString(),
                  quote.currency || 'USD',
                )}
              </Text>
            </View>
          </View>
        </View>

        {/* What's NOT Included */}
        {aiData?.quoteDocument?.exclusions &&
          aiData.quoteDocument.exclusions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What&apos;s NOT Included</Text>
              <View style={styles.termsList}>
                {aiData.quoteDocument.exclusions.map((exclusion, index) => (
                  <Text key={index} style={styles.termItem}>
                    • {exclusion}
                  </Text>
                ))}
              </View>
            </View>
          )}

        {/* Payment Terms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Terms</Text>
          <View style={styles.termsList}>
            {aiData?.quoteDocument?.paymentTerms ? (
              <Text style={styles.termItem}>
                {aiData.quoteDocument.paymentTerms}
              </Text>
            ) : (
              <>
                <Text style={styles.termItem}>
                  • 30% deposit required upon acceptance of this quote.
                </Text>
                <Text style={styles.termItem}>
                  • Remaining 70% due upon project completion.
                </Text>
                <Text style={styles.termItem}>
                  • Payment terms: Net 15 days.
                </Text>
                <Text style={styles.termItem}>
                  • Late payments subject to 1.5% monthly service charge.
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Next Steps */}
        {aiData?.quoteDocument?.nextSteps && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Next Steps</Text>
            <Text style={styles.termsList}>
              {aiData.quoteDocument.nextSteps}
            </Text>
          </View>
        )}

        {/* Terms & Conditions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Terms & Conditions</Text>
          <View style={styles.termsList}>
            {aiData?.quoteDocument?.termsAndConditions?.map((term, index) => (
              <Text key={index} style={styles.termItem}>
                • {term}
              </Text>
            ))}
            {!aiData?.quoteDocument?.termsAndConditions && (
              <>
                <Text style={styles.termItem}>
                  • This quote is valid for 30 days from the date of issue.
                </Text>
                <Text style={styles.termItem}>
                  • Payment terms are Net 15 days.
                </Text>
                <Text style={styles.termItem}>
                  • Changes to the project scope will require written approval
                  and may affect pricing.
                </Text>
                <Text style={styles.termItem}>
                  • Intellectual property rights transfer upon full and final
                  payment.
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Acceptance Section */}
        <View style={styles.finalSection} wrap={false}>
          <Text style={styles.sectionTitle}>Acceptance</Text>
          <Text style={styles.termsList}>
            Your signature below indicates acceptance of this quote, its terms,
            and conditions.
          </Text>
          <View style={styles.signatureSection}>
            <View>
              <View style={styles.signatureBox} />
              <Text style={styles.signatureLabel}>Authorized Signature</Text>
            </View>
            <View>
              <View style={styles.signatureBox} />
              <Text style={styles.signatureLabel}>Date</Text>
            </View>
          </View>
        </View>

        {/* Footer with Page Number */}
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  )
}
