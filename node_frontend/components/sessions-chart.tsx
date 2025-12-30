"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSessionsChart } from "@/hooks/use-dashboard-data"
import type { SessionsChartDataPoint } from "@/dash_department/lib/api"

const chartConfig = {
  unassigned: {
    label: "Yangi Murojatlar",
    color: "hsl(210, 70%, 60%)", // Light blue
  },
  assigned: {
    label: "Faol Murojaatlar",
    color: "hsl(220, 75%, 55%)", // Medium blue
  },
  closed: {
    label: "Yakunlangan",
    color: "hsl(230, 80%, 50%)", // Darker blue
  },
} satisfies ChartConfig

export function SessionsChart() {
  const [timeRange, setTimeRange] = React.useState("30d")
  const { data, isLoading, error } = useSessionsChart(timeRange)
  const [displayData, setDisplayData] = React.useState<SessionsChartDataPoint[]>([])
  const [isTransitioning, setIsTransitioning] = React.useState(false)

  // Smooth transition when data changes
  React.useEffect(() => {
    if (data.length > 0) {
      setIsTransitioning(true)
      // Small delay to allow smooth transition
      const timer = setTimeout(() => {
        setDisplayData(data)
        setIsTransitioning(false)
      }, 50)
      return () => clearTimeout(timer)
    } else {
      setDisplayData(data)
    }
  }, [data])

  // Helper function to format dates safely
  const formatDate = (value: string | Date): string => {
    try {
      const date = typeof value === "string" ? new Date(value) : value
      if (isNaN(date.getTime())) {
        console.warn("Invalid date:", value)
        return String(value)
      }
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    } catch (err) {
      console.error("Error formatting date:", value, err)
      return String(value)
    }
  }

  if (isLoading) {
    return (
      <Card className="w-full pt-0">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <CardTitle>Murojatlar Umumiy</CardTitle>
            <CardDescription>Sessiyalar statistikasi</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div className="aspect-auto h-[250px] w-full bg-muted/50 animate-pulse rounded-md" />
        </CardContent>
      </Card>
    )
  }

  // Empty data handling
  if (error || data.length === 0) {
    return (
      <Card className="w-full pt-0">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <CardTitle>Murojatlar Umumiy</CardTitle>
            <CardDescription>Sessiyalar statistikasi</CardDescription>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
              aria-label="Select a time range"
            >
              <SelectValue placeholder="Oxirgi 30 kun" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="7d" className="rounded-lg">
                Oxirgi 7 kun
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Oxirgi 30 kun
              </SelectItem>
              <SelectItem value="3m" className="rounded-lg">
                Oxirgi 3 oy
              </SelectItem>
              <SelectItem value="all" className="rounded-lg">
                Barcha vaqt
              </SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div className="aspect-auto h-[250px] w-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">
                {error || "Tanlangan davr uchun ma'lumot mavjud emas"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full pt-0 overflow-visible">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Murojatlar Umumiy</CardTitle>
          <CardDescription>Sessiyalar statistikasi</CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
            aria-label="Select a time range"
          >
            <SelectValue placeholder="Oxirgi 30 kun" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="7d" className="rounded-lg">
              Oxirgi 7 kun
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Oxirgi 30 kun
            </SelectItem>
            <SelectItem value="3m" className="rounded-lg">
              Oxirgi 3 oy
            </SelectItem>
            <SelectItem value="all" className="rounded-lg">
              Barcha vaqt
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-[16px] pt-4 sm:px-[32px] sm:pt-6 overflow-hidden">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full [&_svg]:overflow-visible"
        >
          <AreaChart
            key={timeRange}
            data={displayData.length > 0 ? displayData : data}
            margin={{
              top: 10,
              right: 0,
              left: 0,
              bottom: 40,
            }}
          >
            <defs>
              <linearGradient id="fillUnassigned" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={chartConfig.unassigned.color}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={chartConfig.unassigned.color}
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillAssigned" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={chartConfig.assigned.color}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={chartConfig.assigned.color}
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillClosed" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={chartConfig.closed.color}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={chartConfig.closed.color}
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={formatDate}
              padding={{ left: 0, right: 0 }}
              angle={0}
              textAnchor="middle"
              interval="preserveStartEnd"
              height={40}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => formatDate(value)}
                  indicator="dot"
                  formatter={(value, name, item) => {
                    const itemConfig = chartConfig[name as keyof typeof chartConfig]
                    const label = itemConfig?.label || name
                    const indicatorColor = item.payload?.fill || item.color || chartConfig[name as keyof typeof chartConfig]?.color
                    return (
                      <div className="flex w-full flex-wrap items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 shrink-0 rounded-[2px] border"
                          style={{
                            backgroundColor: indicatorColor,
                            borderColor: indicatorColor,
                          }}
                        />
                        <div className="flex flex-1 items-center justify-between gap-2 leading-none">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="text-foreground font-mono font-medium tabular-nums">
                            {typeof value === 'number' ? value.toLocaleString() : value}
                          </span>
                        </div>
                      </div>
                    )
                  }}
                />
              }
            />
            <Area
              dataKey="unassigned"
              type="natural"
              fill="url(#fillUnassigned)"
              stroke={chartConfig.unassigned.color}
              stackId="a"
              animationDuration={1000}
              isAnimationActive={true}
            />
            <Area
              dataKey="assigned"
              type="natural"
              fill="url(#fillAssigned)"
              stroke={chartConfig.assigned.color}
              stackId="a"
              animationDuration={1000}
              isAnimationActive={true}
            />
            <Area
              dataKey="closed"
              type="natural"
              fill="url(#fillClosed)"
              stroke={chartConfig.closed.color}
              stackId="a"
              animationDuration={1000}
              isAnimationActive={true}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
