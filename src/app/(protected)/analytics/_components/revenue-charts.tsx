'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
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

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884d8',
  '#82ca9d',
]

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
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0088FE" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0088FE" stopOpacity={0.1} />
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Breakdown Bar Chart */}
        {breakdownData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{breakdownTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={breakdownData} layout="horizontal">
                    <XAxis
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      className="text-xs"
                      color="red"
                      tickFormatter={(value) => formatCurrency(value, currency)}
                    />
                    <YAxis
                      type="category"
                      dataKey={breakdownKey}
                      axisLine={false}
                      tickLine={false}
                      className="text-xs"
                      width={100}
                    />
                    <Tooltip
                      content={(props) => (
                        <CustomTooltip {...props} currency={currency} />
                      )}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="#00C49F"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Revenue Distribution Pie Chart */}
        {breakdownData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Revenue Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={breakdownData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="revenue"
                      nameKey={breakdownKey}
                    >
                      {breakdownData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={(props) => (
                        <CustomTooltip {...props} currency={currency} />
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                {breakdownData.map((entry, index) => (
                  <div
                    key={entry[breakdownKey as keyof typeof entry]}
                    className="flex items-center gap-2"
                  >
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-muted-foreground truncate text-sm">
                      {entry[breakdownKey as keyof typeof entry]}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
