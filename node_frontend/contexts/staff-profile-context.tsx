"use client"

import * as React from "react"
import { getStaffProfile, type StaffProfileResponse, clearAuthTokens } from "@/dash_department/lib/api"

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

  const loadProfile = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const profile = await getStaffProfile()
      setStaffProfile(profile)
    } catch (err) {
      console.error("Failed to fetch staff profile:", err)
      const error = err instanceof Error ? err : new Error("Failed to fetch staff profile")
      setError(error)
      // If token is invalid, clear tokens so auth flow can handle it
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

  React.useEffect(() => {
    // Fetch once on mount and keep in memory for the lifetime of the app
    loadProfile()
  }, [loadProfile])

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


