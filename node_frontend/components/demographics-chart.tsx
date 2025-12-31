"use client"

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"
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
import { useDemographics } from "@/hooks/use-dashboard-data"

const chartConfig = {
  male: {
    label: "Erkak",
    color: "hsl(210, 70%, 60%)",
  },
  female: {
    label: "Ayol",
    color: "hsl(220, 75%, 55%)",
  },
} satisfies ChartConfig

export function DemographicsChart() {
  const { data, isLoading } = useDemographics()

  if (isLoading || !data) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Demografik ma'lumotlar</CardTitle>
          <CardDescription>Jins bo'yicha taqsimot</CardDescription>
        </CardHeader>
          <CardContent className="flex-1 pb-0 flex items-center justify-center">
            <div className="aspect-square max-h-[300px] w-full max-w-[300px] flex items-center justify-center">
              <div className="h-[280px] w-[280px] bg-muted/50 animate-pulse rounded-full" />
            </div>
          </CardContent>
      </Card>
    )
  }

  const chartData = [
    { 
      gender: "male", 
      count: data.male_count || 0, 
      fill: "var(--color-male)"
    },
    { 
      gender: "female", 
      count: data.female_count || 0, 
      fill: "var(--color-female)"
    },
  ]

  // Safety: Ensure total is never zero to prevent division by zero in percentage calculations
  // The chart library handles percentages internally, but we ensure data integrity
  const totalAppealers = Math.max(data.total_appealers || 0, 0)

  // If no data, show empty state (prevents any potential division by zero)
  if (totalAppealers === 0) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Demografik ma'lumotlar</CardTitle>
          <CardDescription>Jins bo'yicha taqsimot</CardDescription>
        </CardHeader>
          <CardContent className="flex-1 pb-0 flex items-center justify-center">
            <div className="aspect-square max-h-[300px] w-full max-w-[300px] flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground">Ma'lumot mavjud emas</p>
              </div>
            </div>
          </CardContent>
        <CardFooter className="flex-col gap-2 text-sm">
          <div className="text-muted-foreground leading-none">
            Jami murojaatlar soni
          </div>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Demografik ma'lumotlar</CardTitle>
        <CardDescription>Jins bo'yicha taqsimot</CardDescription>
      </CardHeader>
        <CardContent className="flex-1 pb-0 flex items-center justify-center">
          <ChartContainer
            config={chartConfig}
            className="aspect-square max-h-[300px] w-full max-w-[300px]"
          >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="gender"
              innerRadius={60}
              strokeWidth={5}
              stroke="transparent"
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalAppealers.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Fuqarolar
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="text-muted-foreground leading-none">
          Jami murojaatlar soni
        </div>
      </CardFooter>
    </Card>
  )
}

