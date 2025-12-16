"use client"

import * as React from "react"
import { Bar, BarChart, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { getTopNeighborhoods } from "@/dash_department/lib/api"
import type { TopNeighborhood } from "@/dash_department/lib/api"

// Blue color variants
const blueColors = [
  "hsl(210, 70%, 60%)",
  "hsl(215, 72%, 58%)",
  "hsl(220, 75%, 55%)",
  "hsl(225, 77%, 52%)",
  "hsl(230, 80%, 50%)",
  "hsl(235, 82%, 48%)",
]

export function NeighborhoodsChart() {
  const [data, setData] = React.useState<TopNeighborhood[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [chartData, setChartData] = React.useState<Array<{ neighborhood: string; visitors: number; fill: string }>>([])
  const [chartConfig, setChartConfig] = React.useState<ChartConfig>({
    visitors: {
      label: "Murojaatlar",
    },
  })

  React.useEffect(() => {
    async function fetchNeighborhoods() {
      try {
        const neighborhoods = await getTopNeighborhoods()
        setData(neighborhoods)
        
        // Create config and data
        const newConfig: ChartConfig = {
          visitors: {
            label: "Murojaatlar",
          },
        }
        
        const transformed = neighborhoods.map((item, index) => {
          // Use a sanitized key for the config
          const configKey = `neighborhood${index + 1}`
          const color = blueColors[index] || blueColors[0]
          
          // Add to config
          newConfig[configKey] = {
            label: item.neighborhood_name,
            color: color,
          }
          
          return {
            neighborhood: item.neighborhood_name,
            visitors: item.count,
            fill: `var(--color-${configKey})`,
          }
        })
        
        setChartConfig(newConfig)
        setChartData(transformed)
      } catch (error) {
        console.error("Failed to fetch top neighborhoods data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchNeighborhoods()
  }, [])

  if (isLoading || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top mahallalar</CardTitle>
          <CardDescription>Eng ko'p murojaatlar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full bg-muted/50 animate-pulse rounded-md" />
        </CardContent>
      </Card>
    )
  }

  // Calculate max domain value to prevent bars from stretching too wide or too long
  const maxValue = chartData.length > 0 
    ? Math.max(...chartData.map(d => d.visitors))
    : 1
  // Set domain max to 1.2x the max value for padding, with a minimum of 5 to prevent small values from stretching too wide
  // For very large values, this ensures the max bar uses ~83% of the width, keeping it within the container
  const domainMax = Math.max(maxValue * 1.2, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top mahallalar</CardTitle>
        <CardDescription>Eng ko'p murojaatlar</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="w-[calc(100%+30px)]">
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              left: 18,
              right: 20,
            }}
          >
            <YAxis
              dataKey="neighborhood"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => {
                // Find the config entry that has this label
                const configEntry = Object.entries(chartConfig).find(
                  ([_, config]) => config.label === value
                )
                return configEntry ? configEntry[1].label : value
              }}
            />
            <XAxis 
              dataKey="visitors" 
              type="number" 
              hide 
              domain={[0, domainMax]}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, name, item) => {
                    const itemConfig = chartConfig[name as keyof typeof chartConfig]
                    const label = itemConfig?.label || name
                    const indicatorColor = item.payload?.fill || item.color
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
            <Bar 
              dataKey="visitors" 
              layout="vertical" 
              radius={5}
              maxBarSize={80}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="text-muted-foreground leading-none">
          Eng ko'p murojaatlar yuborgan mahallalar
        </div>
      </CardFooter>
    </Card>
  )
}
