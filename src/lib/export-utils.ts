import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

// AutoTable options interface
interface AutoTableOptions {
  startY?: number
  head?: string[][]
  body?: (string | number)[][]
  theme?: 'striped' | 'grid' | 'plain'
  headStyles?: { fillColor?: number[] }
  margin?: { left?: number; right?: number }
}

// Interface for jsPDF with lastAutoTable property
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: { finalY: number }
}

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: AutoTableOptions) => jsPDF
    lastAutoTable?: { finalY: number }
  }
}

export interface AnalyticsExportData {
  summary: {
    totalRevenue: number
    totalQuotes: number
    activeClients: number
    acceptanceRate: number
    currency: string
  }
  revenue: {
    totalRevenue: number
    revenueByMonth: { month: string; revenue: number; currency: string }[]
    revenueByCompany: {
      companyName: string
      revenue: number
      currency: string
    }[]
    revenueByService: {
      serviceName: string
      revenue: number
      currency: string
    }[]
    averageQuoteValue: number
    currency: string
  }
  quotes: {
    totalQuotes: number
    acceptanceRate: number
    conversionFunnel: Record<string, number>
    averageTimeToAcceptance: number
    revisionFrequency: number
    quotesByMonth: { month: string; created: number; accepted: number }[]
  }
  clients: {
    totalClients: number
    clientsByLocation: { country: string; count: number }[]
    topClients: {
      name: string
      email: string
      totalRevenue: number
      quotesCount: number
    }[]
  }
  emails: {
    totalEmails: number
    emailsByDirection: { inbound: number; outbound: number }
    responseRate: number
    emailsByMonth: { month: string; sent: number; received: number }[]
  }
  growth?: {
    growthRate: number
    trendsAnalysis: {
      revenue: 'increasing' | 'decreasing' | 'stable'
      clientBase: 'increasing' | 'decreasing' | 'stable'
      quoteVolume: 'increasing' | 'decreasing' | 'stable'
    }
  }
  dateRange: {
    start: Date
    end: Date
  }
  exportedAt: Date
}

export type ExportFormat = 'csv' | 'excel' | 'pdf'

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`
}

// CSV Export Functions
export function exportAnalyticsToCSV(data: AnalyticsExportData): void {
  const csvContent = generateCSVContent(data)
  downloadFile(csvContent, 'analytics-report.csv', 'text/csv')
}

function generateCSVContent(data: AnalyticsExportData): string {
  const sections: string[] = []

  // Summary Section
  sections.push('ANALYTICS SUMMARY')
  sections.push(
    `Report Period,${formatDate(data.dateRange.start)} - ${formatDate(data.dateRange.end)}`,
  )
  sections.push(`Generated On,${formatDate(data.exportedAt)}`)
  sections.push('')
  sections.push('Metric,Value')
  sections.push(
    `Total Revenue,${formatCurrency(data.summary.totalRevenue, data.summary.currency)}`,
  )
  sections.push(`Total Quotes,${data.summary.totalQuotes}`)
  sections.push(`Active Clients,${data.summary.activeClients}`)
  sections.push(
    `Acceptance Rate,${formatPercentage(data.summary.acceptanceRate)}`,
  )
  sections.push('')

  // Revenue by Month
  if (data.revenue.revenueByMonth.length > 0) {
    sections.push('REVENUE BY MONTH')
    sections.push('Month,Revenue,Currency')
    data.revenue.revenueByMonth.forEach((item) => {
      sections.push(`${item.month},${item.revenue},${item.currency}`)
    })
    sections.push('')
  }

  // Revenue by Company
  if (data.revenue.revenueByCompany.length > 0) {
    sections.push('REVENUE BY COMPANY')
    sections.push('Company,Revenue,Currency')
    data.revenue.revenueByCompany.forEach((item) => {
      sections.push(`"${item.companyName}",${item.revenue},${item.currency}`)
    })
    sections.push('')
  }

  // Revenue by Service
  if (data.revenue.revenueByService.length > 0) {
    sections.push('REVENUE BY SERVICE')
    sections.push('Service,Revenue,Currency')
    data.revenue.revenueByService.forEach((item) => {
      sections.push(`"${item.serviceName}",${item.revenue},${item.currency}`)
    })
    sections.push('')
  }

  // Quote Performance
  sections.push('QUOTE PERFORMANCE')
  sections.push('Metric,Value')
  sections.push(`Total Quotes,${data.quotes.totalQuotes}`)
  sections.push(
    `Acceptance Rate,${formatPercentage(data.quotes.acceptanceRate)}`,
  )
  sections.push(
    `Average Time to Acceptance,${data.quotes.averageTimeToAcceptance.toFixed(1)} days`,
  )
  sections.push(
    `Revision Frequency,${formatPercentage(data.quotes.revisionFrequency)}`,
  )
  sections.push('')

  // Conversion Funnel
  sections.push('CONVERSION FUNNEL')
  sections.push('Status,Count')
  Object.entries(data.quotes.conversionFunnel).forEach(([status, count]) => {
    sections.push(`${status.replace('_', ' ').toUpperCase()},${count}`)
  })
  sections.push('')

  // Top Clients
  if (data.clients.topClients.length > 0) {
    sections.push('TOP CLIENTS')
    sections.push('Name,Email,Total Revenue,Quotes Count')
    data.clients.topClients.forEach((client) => {
      sections.push(
        `"${client.name}","${client.email}",${client.totalRevenue},${client.quotesCount}`,
      )
    })
    sections.push('')
  }

  // Clients by Location
  if (data.clients.clientsByLocation.length > 0) {
    sections.push('CLIENTS BY LOCATION')
    sections.push('Country,Client Count')
    data.clients.clientsByLocation.forEach((location) => {
      sections.push(`"${location.country}",${location.count}`)
    })
    sections.push('')
  }

  // Email Analytics
  sections.push('EMAIL ANALYTICS')
  sections.push('Metric,Value')
  sections.push(`Total Emails,${data.emails.totalEmails}`)
  sections.push(`Outbound Emails,${data.emails.emailsByDirection.outbound}`)
  sections.push(`Inbound Emails,${data.emails.emailsByDirection.inbound}`)
  sections.push(`Response Rate,${formatPercentage(data.emails.responseRate)}`)
  sections.push('')

  // Growth Analytics (if available)
  if (data.growth) {
    sections.push('GROWTH ANALYTICS')
    sections.push('Metric,Value')
    sections.push(
      `Overall Growth Rate,${formatPercentage(data.growth.growthRate)}`,
    )
    sections.push(`Revenue Trend,${data.growth.trendsAnalysis.revenue}`)
    sections.push(`Client Base Trend,${data.growth.trendsAnalysis.clientBase}`)
    sections.push(
      `Quote Volume Trend,${data.growth.trendsAnalysis.quoteVolume}`,
    )
  }

  return sections.join('\n')
}

// Excel Export Functions
export function exportAnalyticsToExcel(data: AnalyticsExportData): void {
  const workbook = XLSX.utils.book_new()

  // Summary Sheet
  const summaryData = [
    ['ANALYTICS SUMMARY'],
    [
      'Report Period',
      `${formatDate(data.dateRange.start)} - ${formatDate(data.dateRange.end)}`,
    ],
    ['Generated On', formatDate(data.exportedAt)],
    [''],
    ['Metric', 'Value'],
    [
      'Total Revenue',
      formatCurrency(data.summary.totalRevenue, data.summary.currency),
    ],
    ['Total Quotes', data.summary.totalQuotes],
    ['Active Clients', data.summary.activeClients],
    ['Acceptance Rate', formatPercentage(data.summary.acceptanceRate)],
  ]

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

  // Revenue Sheet
  if (data.revenue.revenueByMonth.length > 0) {
    const revenueData = [
      ['Month', 'Revenue', 'Currency'],
      ...data.revenue.revenueByMonth.map((item) => [
        item.month,
        item.revenue,
        item.currency,
      ]),
    ]
    const revenueSheet = XLSX.utils.aoa_to_sheet(revenueData)
    XLSX.utils.book_append_sheet(workbook, revenueSheet, 'Revenue by Month')
  }

  // Companies Sheet
  if (data.revenue.revenueByCompany.length > 0) {
    const companyData = [
      ['Company', 'Revenue', 'Currency'],
      ...data.revenue.revenueByCompany.map((item) => [
        item.companyName,
        item.revenue,
        item.currency,
      ]),
    ]
    const companySheet = XLSX.utils.aoa_to_sheet(companyData)
    XLSX.utils.book_append_sheet(workbook, companySheet, 'Revenue by Company')
  }

  // Services Sheet
  if (data.revenue.revenueByService.length > 0) {
    const serviceData = [
      ['Service', 'Revenue', 'Currency'],
      ...data.revenue.revenueByService.map((item) => [
        item.serviceName,
        item.revenue,
        item.currency,
      ]),
    ]
    const serviceSheet = XLSX.utils.aoa_to_sheet(serviceData)
    XLSX.utils.book_append_sheet(workbook, serviceSheet, 'Revenue by Service')
  }

  // Quotes Sheet
  const quotesData = [
    ['Quote Performance'],
    ['Total Quotes', data.quotes.totalQuotes],
    ['Acceptance Rate', formatPercentage(data.quotes.acceptanceRate)],
    [
      'Average Time to Acceptance (days)',
      data.quotes.averageTimeToAcceptance.toFixed(1),
    ],
    ['Revision Frequency', formatPercentage(data.quotes.revisionFrequency)],
    [''],
    ['Conversion Funnel'],
    ['Status', 'Count'],
    ...Object.entries(data.quotes.conversionFunnel).map(([status, count]) => [
      status.replace('_', ' ').toUpperCase(),
      count,
    ]),
  ]
  const quotesSheet = XLSX.utils.aoa_to_sheet(quotesData)
  XLSX.utils.book_append_sheet(workbook, quotesSheet, 'Quote Performance')

  // Clients Sheet
  if (data.clients.topClients.length > 0) {
    const clientsData = [
      ['Name', 'Email', 'Total Revenue', 'Quotes Count'],
      ...data.clients.topClients.map((client) => [
        client.name,
        client.email,
        client.totalRevenue,
        client.quotesCount,
      ]),
    ]
    const clientsSheet = XLSX.utils.aoa_to_sheet(clientsData)
    XLSX.utils.book_append_sheet(workbook, clientsSheet, 'Top Clients')
  }

  // Download
  XLSX.writeFile(workbook, 'analytics-report.xlsx')
}

// PDF Export Functions
export function exportAnalyticsToPDF(data: AnalyticsExportData): void {
  const doc = new jsPDF()
  let yPosition = 20

  // Title
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Analytics Report', 20, yPosition)
  yPosition += 10

  // Report info
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `Period: ${formatDate(data.dateRange.start)} - ${formatDate(data.dateRange.end)}`,
    20,
    yPosition,
  )
  yPosition += 5
  doc.text(`Generated: ${formatDate(data.exportedAt)}`, 20, yPosition)
  yPosition += 15

  // Summary Section
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Summary', 20, yPosition)
  yPosition += 10

  const summaryData = [
    [
      'Total Revenue',
      formatCurrency(data.summary.totalRevenue, data.summary.currency),
    ],
    ['Total Quotes', data.summary.totalQuotes.toString()],
    ['Active Clients', data.summary.activeClients.toString()],
    ['Acceptance Rate', formatPercentage(data.summary.acceptanceRate)],
  ]

  autoTable(doc, {
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [66, 66, 66] },
    margin: { left: 20, right: 20 },
  })

  yPosition =
    ((doc as jsPDFWithAutoTable).lastAutoTable?.finalY || yPosition) + 15

  // Revenue by Month (if available)
  if (data.revenue.revenueByMonth.length > 0) {
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Revenue by Month', 20, yPosition)
    yPosition += 10

    const revenueData = data.revenue.revenueByMonth.map((item) => [
      item.month,
      formatCurrency(item.revenue, item.currency),
    ])

    autoTable(doc, {
      startY: yPosition,
      head: [['Month', 'Revenue']],
      body: revenueData,
      theme: 'grid',
      headStyles: { fillColor: [66, 66, 66] },
      margin: { left: 20, right: 20 },
    })

    yPosition =
      ((doc as jsPDFWithAutoTable).lastAutoTable?.finalY || yPosition) + 15
  }

  // Add new page if needed
  if (yPosition > 250) {
    doc.addPage()
    yPosition = 20
  }

  // Top Clients (if available)
  if (data.clients.topClients.length > 0) {
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Top Clients', 20, yPosition)
    yPosition += 10

    const clientsData = data.clients.topClients
      .slice(0, 10)
      .map((client) => [
        client.name,
        client.email,
        formatCurrency(client.totalRevenue, data.summary.currency),
        client.quotesCount.toString(),
      ])

    autoTable(doc, {
      startY: yPosition,
      head: [['Name', 'Email', 'Revenue', 'Quotes']],
      body: clientsData,
      theme: 'grid',
      headStyles: { fillColor: [66, 66, 66] },
      margin: { left: 20, right: 20 },
    })

    yPosition =
      ((doc as jsPDFWithAutoTable).lastAutoTable?.finalY || yPosition) + 15
  }

  // Quote Performance
  if (yPosition > 200) {
    doc.addPage()
    yPosition = 20
  }

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Quote Performance', 20, yPosition)
  yPosition += 10

  const quoteData = [
    ['Total Quotes', data.quotes.totalQuotes.toString()],
    ['Acceptance Rate', formatPercentage(data.quotes.acceptanceRate)],
    [
      'Avg. Time to Acceptance',
      `${data.quotes.averageTimeToAcceptance.toFixed(1)} days`,
    ],
    ['Revision Frequency', formatPercentage(data.quotes.revisionFrequency)],
  ]

  autoTable(doc, {
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: quoteData,
    theme: 'grid',
    headStyles: { fillColor: [66, 66, 66] },
    margin: { left: 20, right: 20 },
  })

  // Download
  doc.save('analytics-report.pdf')
}

// Helper function to download files
function downloadFile(
  content: string,
  filename: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Main export function
export function exportAnalytics(
  data: AnalyticsExportData,
  format: ExportFormat,
): void {
  switch (format) {
    case 'csv':
      exportAnalyticsToCSV(data)
      break
    case 'excel':
      exportAnalyticsToExcel(data)
      break
    case 'pdf':
      exportAnalyticsToPDF(data)
      break
    default:
      throw new Error(`Unsupported export format: ${format}`)
  }
}
