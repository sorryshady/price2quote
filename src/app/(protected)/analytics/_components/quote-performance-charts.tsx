'use client'

import {
  Bar,
  BarChart,
  ComposedChart,
  Funnel,
  FunnelChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ConversionFunnel {
  draft: number
  awaiting_client: number
  under_revision: number
  revised: number
  accepted: number
  rejected: number
  expired: number
  paid: number
}

interface QuotesByMonth {
  month: string
  created: number
  accepted: number
}

interface QuotePerformanceChartsProps {
  conversionFunnel: ConversionFunnel
  quotesByMonth: QuotesByMonth[]
  acceptanceRate: number
  averageTimeToAcceptance: number
  revisionFrequency: number
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string | number
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background rounded-lg border p-3 shadow-md">
        <p className="text-sm font-medium">{label}</p>
        {payload.map((entry, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value}`}
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

export function QuotePerformanceCharts({
  conversionFunnel,
  quotesByMonth,
  acceptanceRate,
  averageTimeToAcceptance,
  revisionFrequency,
}: QuotePerformanceChartsProps) {
  // Format funnel data
  const funnelData = [
    { name: 'Draft', value: conversionFunnel.draft, fill: '#8884d8' },
    {
      name: 'Awaiting Client',
      value: conversionFunnel.awaiting_client,
      fill: '#82ca9d',
    },
    {
      name: 'Under Revision',
      value: conversionFunnel.under_revision,
      fill: '#FFA500',
    },
    { name: 'Revised', value: conversionFunnel.revised, fill: '#9932CC' },
    { name: 'Accepted', value: conversionFunnel.accepted, fill: '#00C49F' },
    { name: 'Rejected', value: conversionFunnel.rejected, fill: '#FF8042' },
    { name: 'Expired', value: conversionFunnel.expired, fill: '#708090' },
    { name: 'Paid', value: conversionFunnel.paid, fill: '#10B981' },
  ].filter((item) => item.value > 0) // Only show stages with data

  // Format monthly data
  const monthlyData = quotesByMonth.map((item) => ({
    ...item,
    monthLabel: formatMonthLabel(item.month),
    acceptanceRate: item.created > 0 ? (item.accepted / item.created) * 100 : 0,
  }))

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards - Compact Layout */}
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="p-4">
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm font-medium">
              Acceptance Rate
            </p>
            <div className="text-xl font-bold text-green-600">
              {acceptanceRate.toFixed(1)}%
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm font-medium">
              Avg. Time to Accept
            </p>
            <div className="text-xl font-bold text-blue-600">
              {averageTimeToAcceptance.toFixed(1)} days
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm font-medium">
              Revision Rate
            </p>
            <div className="text-xl font-bold text-orange-600">
              {revisionFrequency.toFixed(1) === 'NaN'
                ? '0.0%'
                : `${revisionFrequency.toFixed(1)}%`}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Conversion Funnel */}
        {funnelData.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Quote Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <FunnelChart>
                    <Funnel
                      dataKey="value"
                      data={funnelData}
                      isAnimationActive
                    />
                    <Tooltip content={<CustomTooltip />} />
                  </FunnelChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Quote Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground flex h-[250px] items-center justify-center">
                <p>No data available</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quote Volume by Status */}
        {funnelData.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Quote Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData}>
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      className="text-xs"
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      className="text-xs"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Quote Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground flex h-[250px] items-center justify-center">
                <p>No data available</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quotes and Acceptance Trend */}
      {monthlyData.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Quote Performance Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyData}>
                  <XAxis
                    dataKey="monthLabel"
                    axisLine={false}
                    tickLine={false}
                    className="text-xs"
                  />
                  <YAxis
                    yAxisId="quotes"
                    axisLine={false}
                    tickLine={false}
                    className="text-xs"
                  />
                  <YAxis
                    yAxisId="rate"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    className="text-xs"
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    yAxisId="quotes"
                    dataKey="created"
                    name="Created"
                    fill="#8884d8"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    yAxisId="quotes"
                    dataKey="accepted"
                    name="Accepted"
                    fill="#00C49F"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="rate"
                    type="monotone"
                    dataKey="acceptanceRate"
                    name="Acceptance Rate (%)"
                    stroke="#FF8042"
                    strokeWidth={3}
                    dot={{ fill: '#FF8042', strokeWidth: 2, r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Quote Performance Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground flex h-[250px] items-center justify-center">
              <p>No data available</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
