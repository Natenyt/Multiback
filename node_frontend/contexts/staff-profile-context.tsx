"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { getStaffProfile, type StaffProfileResponse, clearAuthTokens, getAuthToken } from "@/dash_department/lib/api"

interface StaffProfileContextType {
  staffProfile: StaffProfileResponse | null
  isLoading: boolean
  error: Error | null
  refreshProfile: () => Promise<void>
  clearProfile: () => void
}

const StaffProfileContext = React.createContext<StaffProfileContextType | undefined>(undefined)

export function StaffProfileProvider({ children }: { children: React.ReactNode }) {
  const [staffProfile, setStaffProfile] = React.useState<StaffProfileResponse | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)
  const pathname = usePathname()

  const loadProfile = React.useCallback(async () => {
    // If there is no auth token yet (e.g. user is not logged in), don't treat it as an error.
    const token = getAuthToken?.() ?? null
    if (!token) {
      setStaffProfile(null)
      setError(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const profile = await getStaffProfile()
      setStaffProfile(profile)
      // Dispatch event when profile is loaded so dashboard hooks know to fetch data
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('staff-profile-loaded'))
      }
    } catch (err) {
      console.error("Failed to fetch staff profile:", err)
      const error = err instanceof Error ? err : new Error("Failed to fetch staff profile")
      setError(error)
      if (
        error.message.includes("token") ||
        error.message.includes("authentication") ||
        error.message.includes("not valid") ||
        error.message.includes("Authentication failed")
      ) {
        clearAuthTokens()
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial load on mount
  React.useEffect(() => {
    loadProfile()
  }, [loadProfile])

  // Refresh profile when navigating to dashboard routes (after login redirect)
  // This handles the case where user logs in and is redirected to dashboard
  React.useEffect(() => {
    if (pathname?.startsWith('/dashboard')) {
      const token = getAuthToken()
      // If we have a token but no profile (and not currently loading), refresh
      if (token && !staffProfile && !isLoading) {
        loadProfile()
      }
    }
  }, [pathname, staffProfile, isLoading, loadProfile])

  // Listen for storage changes (when token is set after login in same window)
  // Storage events only fire for other tabs/windows, so we need a custom approach
  React.useEffect(() => {
    // Custom event listener for when token is set (can be dispatched from login page)
    const handleTokenSet = () => {
      const token = getAuthToken()
      if (token && !staffProfile && !isLoading) {
        loadProfile()
      }
    }

    // Listen for custom 'auth-token-set' event
    window.addEventListener('auth-token-set', handleTokenSet)

    // Also listen for storage events (for cross-tab scenarios)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token' && e.newValue && !staffProfile) {
        loadProfile()
      }
      if (e.key === 'auth_token' && !e.newValue && staffProfile) {
        setStaffProfile(null)
        setError(null)
      }
    }
    window.addEventListener('storage', handleStorageChange)

    // Periodic check as fallback (only when on dashboard and we have token but no profile)
    // This is a safety net in case the event doesn't fire
    let checkInterval: NodeJS.Timeout | null = null
    if (pathname?.startsWith('/dashboard')) {
      checkInterval = setInterval(() => {
        const token = getAuthToken()
        // Only check if we have token but no profile (and not loading)
        if (token && !staffProfile && !isLoading) {
          loadProfile()
        }
      }, 1000) // Check every 1 second, but only when conditions are met
    }

    return () => {
      window.removeEventListener('auth-token-set', handleTokenSet)
      window.removeEventListener('storage', handleStorageChange)
      if (checkInterval) {
        clearInterval(checkInterval)
      }
    }
  }, [pathname, staffProfile, isLoading, loadProfile])

  const clearProfile = React.useCallback(() => {
    setStaffProfile(null)
    setError(null)
  }, [])

  const value = React.useMemo(
    () => ({
      staffProfile,
      isLoading,
      error,
      refreshProfile: loadProfile,
      clearProfile,
    }),
    [staffProfile, isLoading, error, loadProfile, clearProfile]
  )

  return <StaffProfileContext.Provider value={value}>{children}</StaffProfileContext.Provider>
}

export function useStaffProfile() {
  const ctx = React.useContext(StaffProfileContext)
  if (!ctx) {
    throw new Error("useStaffProfile must be used within StaffProfileProvider")
  }
  return ctx
}


