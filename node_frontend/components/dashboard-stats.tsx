"use client"

import * as React from "react"
import { Poppins } from 'next/font/google'
import { 
  Inbox, 
  CheckCircle2, 
  Trophy, 
  Target,
  TrendingUp
} from "lucide-react"
import { getDashboardStats } from "@/dash_department/lib/api"
import type { DashboardStatsResponse } from "@/dash_department/lib/api"
import { Card } from "@/components/ui/card"

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
})

interface StatCard {
  icon: React.ComponentType<{ className?: string }>
  value: number
  label: string
  iconColor: string
  isPercentage?: boolean
}

export function DashboardStats() {
  const [stats, setStats] = React.useState<DashboardStatsResponse | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getDashboardStats()
        console.log("Dashboard stats fetched successfully:", data)
        setStats(data)
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error)
        // Keep loading state false so skeleton doesn't show forever
        setIsLoading(false)
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (isLoading || !stats) {
    return (
      <div className="flex gap-4 px-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="flex-1 bg-muted/50 p-6 animate-pulse">
            <div className="h-8 w-8 bg-muted-foreground/20 rounded mb-4" />
            <div className="h-8 w-20 bg-muted-foreground/20 rounded mb-2" />
            <div className="h-4 w-32 bg-muted-foreground/20 rounded" />
          </Card>
        ))}
      </div>
    )
  }

  const statCards: StatCard[] = [
    {
      icon: Inbox,
      value: stats.unassigned_count,
      label: "Yangi Murojatlar",
      iconColor: "text-blue-500", // Same blue for all icons
    },
    {
      icon: CheckCircle2,
      value: stats.active_count,
      label: "Faol Murojaatlar",
      iconColor: "text-blue-500", // Same blue for all icons
    },
    {
      icon: Trophy,
      value: stats.solved_today,
      label: "Yakunlangan",
      iconColor: "text-blue-500", // Same blue for all icons
    },
    {
      icon: Target,
      value: stats.personal_best_record,
      label: "Shaxsiy rekord",
      iconColor: "text-blue-500", // Same blue for all icons
    },
    {
      icon: TrendingUp,
      value: Math.round(stats.completion_rate),
      label: "Yakunlanish",
      iconColor: "text-blue-500", // Same blue for all icons
      isPercentage: true,
    },
  ]

  return (
    <div className="flex gap-4 px-4 items-stretch">
      {statCards.map((card, index) => (
        <Card
          key={index}
          className="flex-1 bg-card border border-input rounded-md p-4 flex flex-col items-center text-center gap-0 transition-transform duration-200 ease-out hover:scale-[1.02] cursor-default will-change-transform"
        >
            {/* Icon Gap: 2px */}
            <card.icon className={`h-6 w-6 ${card.iconColor} mb-[22px]`} />
            
            {/* Number Gap: 0.5px */}
            {/* added leading-none to remove line-height spacing so the 0.5px is accurate */}
            <div className="text-3xl font-bold text-foreground leading-none mb-[5px]">
              {card.value}{card.isPercentage ? '%' : ''}
            </div>
            
            <div className={`text-sm text-muted-foreground/70 ${poppins.className} font-medium`}>
              {card.label}
            </div>
        </Card>
      ))}
    </div>
  )
}