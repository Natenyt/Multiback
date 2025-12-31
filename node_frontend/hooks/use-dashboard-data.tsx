"use client"

import * as React from "react"
import {
  getDashboardStats,
  getSessionsChart,
  getDemographics,
  getTopNeighborhoods,
  getStaffUuid,
  type DashboardStatsResponse,
  type SessionsChartDataPoint,
  type DemographicsResponse,
  type TopNeighborhood,
} from "@/dash_department/lib/api"
import { useStaffProfile } from "@/contexts/staff-profile-context"

// Simple in-memory caches that live for the lifetime of the tab
// Track which user's data is cached
let cachedStaffUuid: string | null = null
let dashboardStatsCache: DashboardStatsResponse | null = null
let demographicsCache: DemographicsResponse | null = null
let neighborhoodsCache: TopNeighborhood[] | null = null
const sessionsChartCache: Record<string, SessionsChartDataPoint[] | undefined> = {}

// Function to invalidate dashboard stats cache
export function invalidateDashboardStats() {
  dashboardStatsCache = null
}

// Function to clear ALL dashboard caches (used on logout)
export function clearAllDashboardCaches() {
  cachedStaffUuid = null
  dashboardStatsCache = null
  demographicsCache = null
  neighborhoodsCache = null
  // Clear all entries in sessionsChartCache
  Object.keys(sessionsChartCache).forEach(key => {
    delete sessionsChartCache[key]
  })
}

// Helper function to check if cache is for current user
// Returns true if cache is valid for current user, false otherwise
// Also clears cache if user has changed
function isCacheValid(): boolean {
  const currentStaffUuid = getStaffUuid()
  
  // If no cached UUID, cache is invalid
  if (!cachedStaffUuid) {
    return false
  }
  
  // If no current UUID, cache is invalid (user logged out)
  if (!currentStaffUuid) {
    clearAllDashboardCaches()
    return false
  }
  
  // If current UUID doesn't match cached UUID, user has changed - clear cache
  if (currentStaffUuid !== cachedStaffUuid) {
    // Clear cache for old user but keep cachedStaffUuid update for next check
    dashboardStatsCache = null
    demographicsCache = null
    neighborhoodsCache = null
    Object.keys(sessionsChartCache).forEach(key => {
      delete sessionsChartCache[key]
    })
    cachedStaffUuid = null // Reset so new user's data gets cached
    return false
  }
  
  return true
}

export function useDashboardStats() {
  const [stats, setStats] = React.useState<DashboardStatsResponse | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)
  const [refreshTrigger, setRefreshTrigger] = React.useState(0)
  
  // Use staff profile context to react to profile changes - more reliable than event listeners
  const { staffProfile, isLoading: profileLoading } = useStaffProfile()
  
  // Get staff_uuid from profile or localStorage (fallback)
  // This ensures we have staff_uuid immediately from login response OR from profile
  const currentStaffUuid = React.useMemo(() => {
    return staffProfile?.staff_uuid || getStaffUuid()
  }, [staffProfile])

  React.useEffect(() => {
    // If profile is still loading, wait a bit
    if (profileLoading && !currentStaffUuid) {
      return
    }

    // Check if cache is valid for current user
    const cacheValid = isCacheValid()
    
    // If cache is valid and exists, use it
    if (cacheValid && dashboardStatsCache) {
      setStats(dashboardStatsCache)
      setIsLoading(false)
      return
    }

    // If no staff UUID yet, wait for it (from profile loading or localStorage)
    if (!currentStaffUuid) {
      // Set loading to false only if profile has finished loading and still no UUID
      if (!profileLoading) {
        setIsLoading(false)
      }
      return
    }

    let isMounted = true
    ;(async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getDashboardStats()
        dashboardStatsCache = data
        cachedStaffUuid = currentStaffUuid
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
  }, [refreshTrigger, currentStaffUuid, profileLoading])

  // Refresh function
  const refresh = React.useCallback(() => {
    dashboardStatsCache = null
    setRefreshTrigger(prev => prev + 1)
  }, [])

  return { stats, isLoading, error, refresh }
}

export function useSessionsChart(timeRange: string) {
  const [data, setData] = React.useState<SessionsChartDataPoint[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  
  // Use staff profile context to react to profile changes
  const { staffProfile, isLoading: profileLoading } = useStaffProfile()
  
  // Get staff_uuid from profile or localStorage (fallback)
  const currentStaffUuid = React.useMemo(() => {
    return staffProfile?.staff_uuid || getStaffUuid()
  }, [staffProfile])

  React.useEffect(() => {
    // If profile is still loading, wait a bit
    if (profileLoading && !currentStaffUuid) {
      return
    }

    // Check if cache is valid for current user
    const cacheValid = isCacheValid()
    
    // If cache is valid and exists for this range, use it
    if (cacheValid && sessionsChartCache[timeRange]) {
      setData(sessionsChartCache[timeRange] || [])
      setIsLoading(false)
      return
    }

    // If no staff UUID yet, wait for it
    if (!currentStaffUuid) {
      if (!profileLoading) {
        setIsLoading(false)
      }
      return
    }

    let isMounted = true
    ;(async () => {
      try {
        setIsLoading(true)
        setError(null)
        const chartData = await getSessionsChart(timeRange)
        sessionsChartCache[timeRange] = chartData
        cachedStaffUuid = currentStaffUuid
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
  }, [timeRange, currentStaffUuid, profileLoading])

  return { data, isLoading, error }
}

export function useDemographics() {
  const [data, setData] = React.useState<DemographicsResponse | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)
  
  // Use staff profile context to react to profile changes
  const { staffProfile, isLoading: profileLoading } = useStaffProfile()
  
  // Get staff_uuid from profile or localStorage (fallback)
  const currentStaffUuid = React.useMemo(() => {
    return staffProfile?.staff_uuid || getStaffUuid()
  }, [staffProfile])

  React.useEffect(() => {
    // If profile is still loading, wait a bit
    if (profileLoading && !currentStaffUuid) {
      return
    }

    // Check if cache is valid for current user
    const cacheValid = isCacheValid()
    
    // If cache is valid and exists, use it
    if (cacheValid && demographicsCache) {
      setData(demographicsCache)
      setIsLoading(false)
      return
    }

    // If no staff UUID yet, wait for it
    if (!currentStaffUuid) {
      if (!profileLoading) {
        setIsLoading(false)
      }
      return
    }

    let isMounted = true
    ;(async () => {
      try {
        setIsLoading(true)
        setError(null)
        const demographics = await getDemographics()
        demographicsCache = demographics
        cachedStaffUuid = currentStaffUuid
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
  }, [currentStaffUuid, profileLoading])

  return { data, isLoading, error }
}

export function useTopNeighborhoods() {
  const [data, setData] = React.useState<TopNeighborhood[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)
  
  // Use staff profile context to react to profile changes
  const { staffProfile, isLoading: profileLoading } = useStaffProfile()
  
  // Get staff_uuid from profile or localStorage (fallback)
  const currentStaffUuid = React.useMemo(() => {
    return staffProfile?.staff_uuid || getStaffUuid()
  }, [staffProfile])

  React.useEffect(() => {
    // If profile is still loading, wait a bit
    if (profileLoading && !currentStaffUuid) {
      return
    }

    // Check if cache is valid for current user
    const cacheValid = isCacheValid()
    
    // If cache is valid and exists, use it
    if (cacheValid && neighborhoodsCache) {
      setData(neighborhoodsCache)
      setIsLoading(false)
      return
    }

    // If no staff UUID yet, wait for it
    if (!currentStaffUuid) {
      if (!profileLoading) {
        setIsLoading(false)
      }
      return
    }

    let isMounted = true
    ;(async () => {
      try {
        setIsLoading(true)
        setError(null)
        const neighborhoods = await getTopNeighborhoods()
        neighborhoodsCache = neighborhoods
        cachedStaffUuid = currentStaffUuid
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
  }, [currentStaffUuid, profileLoading])

  return { data, isLoading, error }
}


