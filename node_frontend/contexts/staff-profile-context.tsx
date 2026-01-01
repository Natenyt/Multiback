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

  // Use refs to track state for event handlers (avoids stale closures)
  const staffProfileRef = React.useRef<StaffProfileResponse | null>(null)
  const isLoadingRef = React.useRef<boolean>(true)
  const loadProfileRef = React.useRef<(() => Promise<void>) | null>(null)

  // Keep refs in sync with state
  React.useEffect(() => {
    staffProfileRef.current = staffProfile
    isLoadingRef.current = isLoading
  }, [staffProfile, isLoading])

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
      // getStaffProfile already stores staff_uuid in localStorage, so dashboard hooks can access it
      // The context change will automatically trigger hooks that depend on staffProfile
    } catch (err) {
      // Error logging handled in API layer
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

  // Store loadProfile in ref for event handlers
  React.useEffect(() => {
    loadProfileRef.current = loadProfile
  }, [loadProfile])

  // Initial load on mount
  // Note: loadProfile is included in dependency array even though it's a useCallback with empty deps.
  // This is intentional and correct - React's exhaustive-deps rule requires it, and since loadProfile
  // is stable (memoized with useCallback), this effect will only run once on mount.
  React.useEffect(() => {
    loadProfile()
  }, [loadProfile])

  // Refresh profile when navigating to dashboard routes (after login redirect)
  // This handles the case where user logs in and is redirected to dashboard
  React.useEffect(() => {
    if (pathname?.startsWith('/dashboard')) {
      const token = getAuthToken()
      // If we have a token but no profile (and not currently loading), refresh
      if (token && !staffProfileRef.current && !isLoadingRef.current) {
        loadProfile()
      }
    }
  }, [pathname, loadProfile])

  // Set up event listeners early (on mount) to catch events even if fired before navigation
  // This is more reliable than waiting for pathname changes
  React.useEffect(() => {
    // Helper function to check if profile should be loaded
    const shouldLoadProfile = (): boolean => {
      const token = getAuthToken()
      return !!(token && !staffProfileRef.current && !isLoadingRef.current)
    }

    // Custom event listener for when token is set (dispatched from login page)
    const handleTokenSet = () => {
      if (shouldLoadProfile() && loadProfileRef.current) {
        loadProfileRef.current()
      }
    }

    // Listen for storage events (for cross-tab scenarios)
    // Note: storage events only fire for OTHER tabs/windows, not the current one
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
        if (e.newValue && !staffProfileRef.current) {
          // Token was set in another tab
          if (loadProfileRef.current) {
            loadProfileRef.current()
      }
        } else if (!e.newValue && staffProfileRef.current) {
          // Token was removed in another tab - clear profile and refs
          setStaffProfile(null)
          setError(null)
          staffProfileRef.current = null
          isLoadingRef.current = true
        }
    }
    }

    // Set up event listeners immediately (they'll catch events even if fired early)
    window.addEventListener('auth-token-set', handleTokenSet)
    window.addEventListener('storage', handleStorageChange)

    // One-time delayed check as a fallback (instead of continuous polling)
    // This handles edge cases where events might be missed due to timing
    // Only runs once after a short delay, not continuously
    const fallbackTimeout = setTimeout(() => {
      // Only check if we're on dashboard and still need to load profile
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname
        if (currentPath.startsWith('/dashboard') && shouldLoadProfile() && loadProfileRef.current) {
          loadProfileRef.current()
        }
        }
    }, 500) // Single check after 500ms, not continuous polling

    return () => {
      window.removeEventListener('auth-token-set', handleTokenSet)
      window.removeEventListener('storage', handleStorageChange)
      clearTimeout(fallbackTimeout)
    }
  }, []) // Empty deps - set up once on mount, use refs for current state

  const clearProfile = React.useCallback(() => {
    setStaffProfile(null)
    setError(null)
    // Also clear refs to ensure they're reset
    staffProfileRef.current = null
    isLoadingRef.current = true
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


