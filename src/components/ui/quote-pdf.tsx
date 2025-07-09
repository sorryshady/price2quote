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

// Professional color palette
const COLORS = {
  primary: '#1f2937', // Dark gray
  secondary: '#374151', // Medium gray
  accent: '#3b82f6', // Blue
  text: {
    primary: '#1f2937',
    secondary: '#6b7280',
    muted: '#9ca3af',
  },
  background: {
    white: '#ffffff',
    light: '#f9fafb',
    section: '#f3f4f6',
  },
  border: '#e5e7eb',
}

// Enhanced styles with professional design
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    backgroundColor: COLORS.background.white,
    color: COLORS.text.primary,
    padding: 0,
    lineHeight: 1.4,
  },

  // Header Section
  header: {
    backgroundColor: COLORS.background.section,
    padding: 30,
    borderBottom: `2px solid ${COLORS.border}`,
    marginBottom: 0,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: 60,
    height: 60,
    marginRight: 20,
    objectFit: 'contain',
    borderRadius: 8,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  companyTagline: {
    fontSize: 10,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  companyDetails: {
    fontSize: 9,
    color: COLORS.text.secondary,
    marginBottom: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
    minWidth: 150,
  },
  quoteTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginBottom: 4,
    letterSpacing: 1,
  },
  quoteNumber: {
    fontSize: 11,
    color: COLORS.text.secondary,
    marginBottom: 2,
  },
  quoteDate: {
    fontSize: 10,
    color: COLORS.text.secondary,
    marginBottom: 2,
  },
  validUntil: {
    fontSize: 9,
    color: COLORS.text.muted,
    fontStyle: 'italic',
  },

  // Content Area
  content: {
    padding: 30,
  },

  // Client Information Section
  clientSection: {
    marginBottom: 25,
    padding: 20,
    backgroundColor: COLORS.background.light,
    borderRadius: 8,
    border: `1px solid ${COLORS.border}`,
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  billToTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clientInfo: {
    flex: 1,
    paddingRight: 20,
  },
  projectInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 3,
  },
  clientDetail: {
    fontSize: 10,
    color: COLORS.text.secondary,
    marginBottom: 2,
  },
  projectTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 3,
  },

  // Section Styles
  section: {
    marginBottom: 25,
    backgroundColor: COLORS.background.white,
    borderRadius: 8,
    border: `1px solid ${COLORS.border}`,
    overflow: 'hidden',
  },
  sectionHeader: {
    backgroundColor: COLORS.background.section,
    padding: 15,
    borderBottom: `1px solid ${COLORS.border}`,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionContent: {
    padding: 20,
  },

  // Executive Summary
  executiveSummary: {
    fontSize: 11,
    color: COLORS.text.primary,
    lineHeight: 1.5,
    marginBottom: 15,
  },

  // Service Breakdown
  serviceItem: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottom: `1px solid ${COLORS.border}`,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  servicePrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  serviceDescription: {
    fontSize: 10,
    color: COLORS.text.secondary,
    marginBottom: 8,
    lineHeight: 1.4,
  },
  serviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  serviceQty: {
    fontSize: 9,
    color: COLORS.text.secondary,
  },
  deliverablesList: {
    marginTop: 8,
  },
  deliverableItem: {
    fontSize: 9,
    color: COLORS.text.secondary,
    marginBottom: 2,
    paddingLeft: 10,
  },

  // Investment Summary
  investmentSection: {
    backgroundColor: COLORS.background.light,
    padding: 20,
    marginTop: 20,
  },
  investmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  investmentLabel: {
    fontSize: 11,
    color: COLORS.text.primary,
  },
  investmentAmount: {
    fontSize: 11,
    color: COLORS.text.primary,
    fontWeight: 'bold',
  },
  subtotalRow: {
    paddingTop: 8,
    borderTop: `1px solid ${COLORS.border}`,
  },
  totalRow: {
    borderTop: `2px solid ${COLORS.primary}`,
    paddingTop: 10,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.accent,
  },

  // Terms and Conditions
  termsList: {
    marginTop: 10,
  },
  termItem: {
    fontSize: 10,
    color: COLORS.text.secondary,
    marginBottom: 6,
    paddingLeft: 12,
  },

  // Next Steps
  nextStepsList: {
    marginTop: 10,
  },
  nextStepItem: {
    fontSize: 10,
    color: COLORS.text.primary,
    marginBottom: 6,
    paddingLeft: 12,
    fontWeight: 'bold',
  },

  // Footer
  footer: {
    marginTop: 30,
    padding: 20,
    backgroundColor: COLORS.background.section,
    borderTop: `1px solid ${COLORS.border}`,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 9,
    color: COLORS.text.muted,
    marginBottom: 8,
  },
  footerSignature: {
    marginTop: 15,
    paddingTop: 15,
    borderTop: `1px solid ${COLORS.border}`,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: 200,
    borderBottom: `1px solid ${COLORS.border}`,
    paddingBottom: 2,
  },
  signatureLabel: {
    fontSize: 8,
    color: COLORS.text.muted,
    marginTop: 5,
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
    return formatCurrencyUtil(amount, currency)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date))
  }

  const getValidUntilDate = () => {
    const validDate = new Date(quote.createdAt)
    validDate.setDate(validDate.getDate() + 30)
    return formatDate(validDate)
  }

  // Calculate totals with tax support
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
        {/* Professional Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              {company?.logoUrl && (
                <Image src={company.logoUrl} style={styles.logo} />
              )}
              <View style={styles.companyInfo}>
                <Text style={styles.companyName}>
                  {company?.name || 'Your Company'}
                </Text>
                <Text style={styles.companyTagline}>
                  {company?.businessType === 'freelancer'
                    ? 'Professional Services'
                    : 'Business Solutions'}
                </Text>
                {company?.address && (
                  <Text style={styles.companyDetails}>{company.address}</Text>
                )}
                {company?.phone && (
                  <Text style={styles.companyDetails}>📞 {company.phone}</Text>
                )}
                {company?.email && (
                  <Text style={styles.companyDetails}>✉️ {company.email}</Text>
                )}
                {company?.website && (
                  <Text style={styles.companyDetails}>
                    🌐 {company.website}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.quoteTitle}>QUOTE</Text>
              <Text style={styles.quoteNumber}>
                #{quote.id.slice(0, 8).toUpperCase()}
              </Text>
              <Text style={styles.quoteDate}>
                Date: {formatDate(quote.createdAt)}
              </Text>
              <Text style={styles.validUntil}>
                Valid until: {getValidUntilDate()}
              </Text>
            </View>
          </View>
        </View>

        {/* Content Area */}
        <View style={styles.content}>
          {/* Client Information & Project Overview */}
          <View style={styles.clientSection}>
            <View style={styles.clientHeader}>
              <Text style={styles.billToTitle}>Bill To:</Text>
              <Text style={styles.billToTitle}>Project Overview</Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>
                  {quote.clientName || 'Client Name'}
                </Text>
                {quote.clientEmail && (
                  <Text style={styles.clientDetail}>
                    ✉️ {quote.clientEmail}
                  </Text>
                )}
                {quote.clientLocation && (
                  <Text style={styles.clientDetail}>
                    📍 {quote.clientLocation}
                  </Text>
                )}
                {quote.clientBudget && (
                  <Text style={styles.clientDetail}>
                    💰 Budget:{' '}
                    {formatCurrency(
                      quote.clientBudget.toString(),
                      quote.currency,
                    )}
                  </Text>
                )}
              </View>
              <View style={styles.projectInfo}>
                <Text style={styles.projectTitle}>{quote.projectTitle}</Text>
                {quote.projectDescription && (
                  <Text style={styles.clientDetail}>
                    {quote.projectDescription}
                  </Text>
                )}
                <Text style={styles.clientDetail}>
                  📅 Timeline: {quote.deliveryTimeline.replace('_', ' ')}
                  {quote.customTimeline && ` (${quote.customTimeline})`}
                </Text>
                <Text style={styles.clientDetail}>
                  🎯 Complexity: {quote.projectComplexity}
                </Text>
              </View>
            </View>
          </View>

          {/* Executive Summary */}
          {aiData?.quoteDocument?.executiveSummary && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Executive Summary</Text>
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.executiveSummary}>
                  {aiData.quoteDocument.executiveSummary}
                </Text>
              </View>
            </View>
          )}

          {/* Service Breakdown */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Service Breakdown</Text>
            </View>
            <View style={styles.sectionContent}>
              {/* AI-generated services */}
              {aiData?.quoteDocument?.serviceBreakdown?.map(
                (service, index) => (
                  <View key={index} style={styles.serviceItem}>
                    <View style={styles.serviceHeader}>
                      <Text style={styles.serviceName}>
                        {service.serviceName}
                      </Text>
                      <Text style={styles.servicePrice}>
                        {formatCurrency(
                          service.totalPrice.toString(),
                          quote.currency,
                        )}
                      </Text>
                    </View>
                    <Text style={styles.serviceDescription}>
                      {service.description}
                    </Text>
                    <View style={styles.serviceDetails}>
                      <Text style={styles.serviceQty}>
                        Quantity: {service.quantity} ×{' '}
                        {formatCurrency(
                          service.unitPrice.toString(),
                          quote.currency,
                        )}
                      </Text>
                    </View>
                    {service.deliverables &&
                      service.deliverables.length > 0 && (
                        <View style={styles.deliverablesList}>
                          <Text
                            style={[
                              styles.serviceQty,
                              { fontWeight: 'bold', marginBottom: 4 },
                            ]}
                          >
                            Deliverables:
                          </Text>
                          {service.deliverables.map((deliverable, idx) => (
                            <Text key={idx} style={styles.deliverableItem}>
                              • {deliverable}
                            </Text>
                          ))}
                        </View>
                      )}
                    {service.assumptions && service.assumptions.length > 0 && (
                      <View style={styles.deliverablesList}>
                        <Text
                          style={[
                            styles.serviceQty,
                            { fontWeight: 'bold', marginBottom: 4 },
                          ]}
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
                ),
              )}

              {/* Fallback: Show basic services if no AI data */}
              {!aiData?.quoteDocument?.serviceBreakdown &&
                quote.quoteServices?.map((qs, index) => (
                  <View key={qs.id || index} style={styles.serviceItem}>
                    <View style={styles.serviceHeader}>
                      <Text style={styles.serviceName}>
                        {qs.service?.name || 'Service'}
                      </Text>
                      <Text style={styles.servicePrice}>
                        {formatCurrency(qs.totalPrice, quote.currency)}
                      </Text>
                    </View>
                    {qs.service?.description && (
                      <Text style={styles.serviceDescription}>
                        {qs.service.description}
                      </Text>
                    )}
                    <View style={styles.serviceDetails}>
                      <Text style={styles.serviceQty}>
                        Quantity: {qs.quantity} ×{' '}
                        {formatCurrency(qs.unitPrice, quote.currency)}
                      </Text>
                    </View>
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
                  <Text style={styles.investmentLabel}>Subtotal:</Text>
                  <Text style={styles.investmentAmount}>
                    {formatCurrency(subtotal.toString(), quote.currency)}
                  </Text>
                </View>
                {taxEnabled && taxAmount > 0 && (
                  <View style={styles.investmentRow}>
                    <Text style={styles.investmentLabel}>
                      Tax ({taxRatePercent.toFixed(1)}%):
                    </Text>
                    <Text style={styles.investmentAmount}>
                      {formatCurrency(taxAmount.toString(), quote.currency)}
                    </Text>
                  </View>
                )}
                <View style={[styles.investmentRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total Investment:</Text>
                  <Text style={styles.totalAmount}>
                    {formatCurrency(totalAmount.toString(), quote.currency)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* What&apos;s NOT Included */}
          {aiData?.quoteDocument?.exclusions &&
            aiData.quoteDocument.exclusions.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    What&apos;s NOT Included
                  </Text>
                </View>
                <View style={styles.sectionContent}>
                  <View style={styles.termsList}>
                    {aiData.quoteDocument.exclusions.map((exclusion, index) => (
                      <Text key={index} style={styles.termItem}>
                        • {exclusion}
                      </Text>
                    ))}
                  </View>
                </View>
              </View>
            )}

          {/* Payment Terms */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Payment Terms</Text>
            </View>
            <View style={styles.sectionContent}>
              {aiData?.quoteDocument?.paymentTerms ? (
                <Text style={styles.executiveSummary}>
                  {aiData.quoteDocument.paymentTerms}
                </Text>
              ) : (
                <>
                  <Text style={styles.executiveSummary}>
                    • 30% deposit required upon acceptance of this quote
                  </Text>
                  <Text style={styles.executiveSummary}>
                    • Remaining 70% due upon project completion
                  </Text>
                  <Text style={styles.executiveSummary}>
                    • Payment terms: Net 15 days
                  </Text>
                  <Text style={styles.executiveSummary}>
                    • Late payments subject to 1.5% monthly service charge
                  </Text>
                </>
              )}
            </View>
          </View>

          {/* Terms &amp; Conditions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Terms & Conditions</Text>
            </View>
            <View style={styles.sectionContent}>
              {aiData?.quoteDocument?.termsAndConditions ? (
                <View style={styles.termsList}>
                  {aiData.quoteDocument.termsAndConditions.map(
                    (term, index) => (
                      <Text key={index} style={styles.termItem}>
                        • {term}
                      </Text>
                    ),
                  )}
                </View>
              ) : (
                <View style={styles.termsList}>
                  <Text style={styles.termItem}>
                    • This quote is valid for 30 days from the date of issue
                  </Text>
                  <Text style={styles.termItem}>
                    • All work will be performed in accordance with industry
                    standards
                  </Text>
                  <Text style={styles.termItem}>
                    • Changes to project scope will require written approval and
                    may affect pricing
                  </Text>
                  <Text style={styles.termItem}>
                    • Client is responsible for providing timely feedback and
                    required materials
                  </Text>
                  <Text style={styles.termItem}>
                    • Intellectual property rights transfer upon full payment
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Next Steps */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Next Steps</Text>
            </View>
            <View style={styles.sectionContent}>
              {aiData?.quoteDocument?.nextSteps ? (
                <Text style={styles.executiveSummary}>
                  {aiData.quoteDocument.nextSteps}
                </Text>
              ) : (
                <View style={styles.nextStepsList}>
                  <Text style={styles.nextStepItem}>
                    1. Review this quote and reach out with any questions
                  </Text>
                  <Text style={styles.nextStepItem}>
                    2. Reply with your acceptance to begin the project
                  </Text>
                  <Text style={styles.nextStepItem}>
                    3. We&apos;ll send an invoice for the initial deposit
                  </Text>
                  <Text style={styles.nextStepItem}>
                    4. Project kickoff call to finalize details and timeline
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Professional Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Thank you for considering our services. We look forward to working
            with you!
          </Text>
          <Text style={styles.footerText}>
            Questions? Contact us at{' '}
            {company?.email || company?.phone || 'your contact info'}
          </Text>

          {/* Signature Section */}
          <View style={styles.footerSignature}>
            <View>
              <View style={styles.signatureBox} />
              <Text style={styles.signatureLabel}>Client Signature</Text>
            </View>
            <View>
              <View style={styles.signatureBox} />
              <Text style={styles.signatureLabel}>Date</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}
