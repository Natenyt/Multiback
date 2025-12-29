"use client"

import * as React from "react"
import {
  getDashboardStats,
  getSessionsChart,
  getDemographics,
  getTopNeighborhoods,
  type DashboardStatsResponse,
  type SessionsChartDataPoint,
  type DemographicsResponse,
  type TopNeighborhood,
} from "@/dash_department/lib/api"

// Simple in-memory caches that live for the lifetime of the tab
let dashboardStatsCache: DashboardStatsResponse | null = null
let demographicsCache: DemographicsResponse | null = null
let neighborhoodsCache: TopNeighborhood[] | null = null
const sessionsChartCache: Record<string, SessionsChartDataPoint[] | undefined> = {}

export function useDashboardStats() {
  const [stats, setStats] = React.useState<DashboardStatsResponse | null>(dashboardStatsCache)
  const [isLoading, setIsLoading] = React.useState(!dashboardStatsCache)
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    if (dashboardStatsCache) return

    let isMounted = true
    ;(async () => {
      try {
        setIsLoading(true)
        const data = await getDashboardStats()
        dashboardStatsCache = data
        if (isMounted) {
          setStats(data)
        }
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err)
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Failed to fetch dashboard stats"))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    })()

    return () => {
      isMounted = false
    }
  }, [])

  return { stats, isLoading, error }
}

export function useSessionsChart(timeRange: string) {
  const [data, setData] = React.useState<SessionsChartDataPoint[]>(
    sessionsChartCache[timeRange] ?? []
  )
  const [isLoading, setIsLoading] = React.useState(!sessionsChartCache[timeRange])
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    // If we already have cached data for this range, just use it
    if (sessionsChartCache[timeRange]) {
      setData(sessionsChartCache[timeRange] || [])
      setIsLoading(false)
      return
    }

    let isMounted = true
    ;(async () => {
      try {
        setIsLoading(true)
        setError(null)
        const chartData = await getSessionsChart(timeRange)
        sessionsChartCache[timeRange] = chartData
        if (isMounted) {
          setData(chartData)
        }
      } catch (err) {
        console.error("Failed to fetch sessions chart data:", err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to fetch chart data")
          setData([])
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    })()

    return () => {
      isMounted = false
    }
  }, [timeRange])

  return { data, isLoading, error }
}

export function useDemographics() {
  const [data, setData] = React.useState<DemographicsResponse | null>(demographicsCache)
  const [isLoading, setIsLoading] = React.useState(!demographicsCache)
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    if (demographicsCache) return

    let isMounted = true
    ;(async () => {
      try {
        setIsLoading(true)
        const demographics = await getDemographics()
        demographicsCache = demographics
        if (isMounted) {
          setData(demographics)
        }
      } catch (err) {
        console.error("Failed to fetch demographics data:", err)
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Failed to fetch demographics data"))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    })()

    return () => {
      isMounted = false
    }
  }, [])

  return { data, isLoading, error }
}

export function useTopNeighborhoods() {
  const [data, setData] = React.useState<TopNeighborhood[]>(neighborhoodsCache || [])
  const [isLoading, setIsLoading] = React.useState(!neighborhoodsCache)
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    if (neighborhoodsCache) return

    let isMounted = true
    ;(async () => {
      try {
        setIsLoading(true)
        const neighborhoods = await getTopNeighborhoods()
        neighborhoodsCache = neighborhoods
        if (isMounted) {
          setData(neighborhoods)
        }
      } catch (err) {
        console.error("Failed to fetch top neighborhoods data:", err)
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Failed to fetch top neighborhoods data"))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    })()

    return () => {
      isMounted = false
    }
  }, [])

  return { data, isLoading, error }
}


