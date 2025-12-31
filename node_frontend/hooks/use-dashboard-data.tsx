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
  const [staffUuidTrigger, setStaffUuidTrigger] = React.useState(0)

  // Listen for staff_uuid changes (when profile loads after login)
  React.useEffect(() => {
    const checkStaffUuid = () => {
      const currentStaffUuid = getStaffUuid()
      if (currentStaffUuid) {
        setStaffUuidTrigger(prev => prev + 1)
      }
    }

    // Check immediately
    checkStaffUuid()

    // Listen for storage changes (when staff_uuid is set)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'staff_uuid' && e.newValue) {
        checkStaffUuid()
      }
    }

    // Also listen for custom event when profile loads
    const handleProfileLoaded = () => {
      checkStaffUuid()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('staff-profile-loaded', handleProfileLoaded)

    // Periodic check as fallback (only if staff_uuid not set yet)
    const interval = setInterval(() => {
      if (!getStaffUuid()) {
        checkStaffUuid()
      } else {
        clearInterval(interval)
      }
    }, 500) // Check every 500ms until staff_uuid is available

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('staff-profile-loaded', handleProfileLoaded)
      clearInterval(interval)
    }
  }, [])

  React.useEffect(() => {
    // Check if cache is valid for current user
    const cacheValid = isCacheValid()
    const currentStaffUuid = getStaffUuid()
    
    // If cache is valid and exists, use it
    if (cacheValid && dashboardStatsCache) {
      setStats(dashboardStatsCache)
      setIsLoading(false)
      return
    }

    // If no staff UUID, we can't fetch - but keep loading state if we expect it soon
    if (!currentStaffUuid) {
      // Only stop loading if we've waited a reasonable time (profile should load quickly)
      // Otherwise wait a bit for staff_uuid to become available
      const timeout = setTimeout(() => {
        setIsLoading(false)
      }, 2000) // Wait 2 seconds for profile to load
      
      return () => clearTimeout(timeout)
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
  }, [refreshTrigger, staffUuidTrigger])

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
  const [staffUuidTrigger, setStaffUuidTrigger] = React.useState(0)

  // Listen for staff_uuid changes (when profile loads after login)
  React.useEffect(() => {
    const checkStaffUuid = () => {
      const currentStaffUuid = getStaffUuid()
      if (currentStaffUuid) {
        setStaffUuidTrigger(prev => prev + 1)
      }
    }

    checkStaffUuid()

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'staff_uuid' && e.newValue) {
        checkStaffUuid()
      }
    }

    const handleProfileLoaded = () => {
      checkStaffUuid()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('staff-profile-loaded', handleProfileLoaded)

    const interval = setInterval(() => {
      if (!getStaffUuid()) {
        checkStaffUuid()
      } else {
        clearInterval(interval)
      }
    }, 500)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('staff-profile-loaded', handleProfileLoaded)
      clearInterval(interval)
    }
  }, [])

  React.useEffect(() => {
    // Check if cache is valid for current user
    const cacheValid = isCacheValid()
    const currentStaffUuid = getStaffUuid()
    
    // If cache is valid and exists for this range, use it
    if (cacheValid && sessionsChartCache[timeRange]) {
      setData(sessionsChartCache[timeRange] || [])
      setIsLoading(false)
      return
    }

    // If no staff UUID, wait a bit for it to become available
    if (!currentStaffUuid) {
      const timeout = setTimeout(() => {
        setIsLoading(false)
      }, 2000)
      return () => clearTimeout(timeout)
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
  }, [timeRange, staffUuidTrigger])

  return { data, isLoading, error }
}

export function useDemographics() {
  const [data, setData] = React.useState<DemographicsResponse | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)
  const [staffUuidTrigger, setStaffUuidTrigger] = React.useState(0)

  // Listen for staff_uuid changes (when profile loads after login)
  React.useEffect(() => {
    const checkStaffUuid = () => {
      const currentStaffUuid = getStaffUuid()
      if (currentStaffUuid) {
        setStaffUuidTrigger(prev => prev + 1)
      }
    }

    checkStaffUuid()

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'staff_uuid' && e.newValue) {
        checkStaffUuid()
      }
    }

    const handleProfileLoaded = () => {
      checkStaffUuid()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('staff-profile-loaded', handleProfileLoaded)

    const interval = setInterval(() => {
      if (!getStaffUuid()) {
        checkStaffUuid()
      } else {
        clearInterval(interval)
      }
    }, 500)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('staff-profile-loaded', handleProfileLoaded)
      clearInterval(interval)
    }
  }, [])

  React.useEffect(() => {
    // Check if cache is valid for current user
    const cacheValid = isCacheValid()
    const currentStaffUuid = getStaffUuid()
    
    // If cache is valid and exists, use it
    if (cacheValid && demographicsCache) {
      setData(demographicsCache)
      setIsLoading(false)
      return
    }

    // If no staff UUID, wait a bit for it to become available
    if (!currentStaffUuid) {
      const timeout = setTimeout(() => {
        setIsLoading(false)
      }, 2000)
      return () => clearTimeout(timeout)
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
  }, [staffUuidTrigger])

  return { data, isLoading, error }
}

export function useTopNeighborhoods() {
  const [data, setData] = React.useState<TopNeighborhood[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)
  const [staffUuidTrigger, setStaffUuidTrigger] = React.useState(0)

  // Listen for staff_uuid changes (when profile loads after login)
  React.useEffect(() => {
    const checkStaffUuid = () => {
      const currentStaffUuid = getStaffUuid()
      if (currentStaffUuid) {
        setStaffUuidTrigger(prev => prev + 1)
      }
    }

    checkStaffUuid()

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'staff_uuid' && e.newValue) {
        checkStaffUuid()
      }
    }

    const handleProfileLoaded = () => {
      checkStaffUuid()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('staff-profile-loaded', handleProfileLoaded)

    const interval = setInterval(() => {
      if (!getStaffUuid()) {
        checkStaffUuid()
      } else {
        clearInterval(interval)
      }
    }, 500)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('staff-profile-loaded', handleProfileLoaded)
      clearInterval(interval)
    }
  }, [])

  React.useEffect(() => {
    // Check if cache is valid for current user
    const cacheValid = isCacheValid()
    const currentStaffUuid = getStaffUuid()
    
    // If cache is valid and exists, use it
    if (cacheValid && neighborhoodsCache) {
      setData(neighborhoodsCache)
      setIsLoading(false)
      return
    }

    // If no staff UUID, wait a bit for it to become available
    if (!currentStaffUuid) {
      const timeout = setTimeout(() => {
        setIsLoading(false)
      }, 2000)
      return () => clearTimeout(timeout)
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
  }, [staffUuidTrigger])

  return { data, isLoading, error }
}


