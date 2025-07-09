'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { formatCurrency } from '@/lib/utils'

interface RevenueByMonth {
  month: string
  revenue: number
  currency: string
}

interface RevenueByCompany {
  companyName: string
  revenue: number
  currency: string
}

interface RevenueByService {
  serviceName: string
  revenue: number
  currency: string
}

interface RevenueChartsProps {
  revenueByMonth: RevenueByMonth[]
  revenueByCompany: RevenueByCompany[]
  revenueByService?: RevenueByService[]
  currency: string
  mode?: 'auto' | 'company' | 'service' // Controls which breakdown to show
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string | number
  currency: string
}

function CustomTooltip({ active, payload, label, currency }: TooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background rounded-lg border p-3 shadow-md">
        <p className="text-sm font-medium">{label}</p>
        {payload.map((entry, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {`${entry.name}: ${formatCurrency(entry.value, currency)}`}
          </p>
        ))}
      </div>
    )
  }
  return null
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export function RevenueCharts({
  revenueByMonth,
  revenueByCompany,
  revenueByService = [],
  currency,
  mode = 'auto',
}: RevenueChartsProps) {
  // Format data for charts
  const monthlyData = revenueByMonth.map((item) => ({
    ...item,
    monthLabel: formatMonthLabel(item.month),
  }))

  const companyData = revenueByCompany.slice(0, 8) // Top 8 companies for readability
  const serviceData = revenueByService.slice(0, 8) // Top 8 services for readability

  // Determine breakdown based on mode
  let breakdownData: typeof companyData | typeof serviceData
  let breakdownTitle: string
  let breakdownKey: string

  if (mode === 'company') {
    // Force company breakdown
    breakdownData = companyData
    breakdownTitle = 'Revenue by Company'
    breakdownKey = 'companyName'
  } else if (mode === 'service') {
    // Force service breakdown
    breakdownData = serviceData
    breakdownTitle = 'Revenue by Service'
    breakdownKey = 'serviceName'
  } else {
    // Auto mode: Smart breakdown logic
    // - Multiple companies: show company breakdown
    // - Single company: show service breakdown (if available)
    const hasMultipleCompanies = companyData.length > 1
    const hasServices = serviceData.length > 0

    if (hasMultipleCompanies) {
      breakdownData = companyData
      breakdownTitle = 'Revenue by Company'
      breakdownKey = 'companyName'
    } else if (hasServices) {
      breakdownData = serviceData
      breakdownTitle = 'Revenue by Service'
      breakdownKey = 'serviceName'
    } else {
      // Fallback to company even if just one
      breakdownData = companyData
      breakdownTitle = 'Revenue by Company'
      breakdownKey = 'companyName'
    }
  }

  return (
    <div className="space-y-6">
      {/* Revenue Trend Line Chart */}
      {monthlyData.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient
                      id="colorRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#0088FE" stopOpacity={0.8} />
                      <stop
                        offset="95%"
                        stopColor="#0088FE"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="monthLabel"
                    axisLine={false}
                    tickLine={false}
                    className="text-xs"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    className="text-xs"
                    tickFormatter={(value) => formatCurrency(value, currency)}
                  />
                  <Tooltip
                    content={(props) => (
                      <CustomTooltip {...props} currency={currency} />
                    )}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0088FE"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground flex h-[300px] items-center justify-center">
              <p>No data available</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revenue Breakdown Bar Chart */}
      {breakdownData.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{breakdownTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Check if all revenue values are 0 */}
            {breakdownData.every((item) => item.revenue === 0) ? (
              <div className="text-muted-foreground flex h-[300px] items-center justify-center">
                <div className="text-center">
                  <p className="mb-2">No revenue data available</p>
                  <p className="text-sm">
                    {mode === 'service'
                      ? 'Services may not be properly linked to accepted quotes'
                      : 'No revenue has been generated yet'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={breakdownData.filter((item) => item.revenue > 0)}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <XAxis
                      dataKey={breakdownKey}
                      axisLine={false}
                      tickLine={false}
                      className="text-xs"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      className="text-xs"
                      tickFormatter={(value) => formatCurrency(value, currency)}
                    />
                    <Tooltip
                      content={(props) => (
                        <CustomTooltip {...props} currency={currency} />
                      )}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="#00C49F"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{breakdownTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground flex h-[300px] items-center justify-center">
              <p>No data available</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
