"use client"

import * as React from "react"

interface AuthErrorContextType {
  authError: Error | null
  setAuthError: (error: Error | null) => void
  clearAuthError: () => void
}

const AuthErrorContext = React.createContext<AuthErrorContextType | undefined>(undefined)

export function AuthErrorProvider({ children }: { children: React.ReactNode }) {
  const [authError, setAuthError] = React.useState<Error | null>(null)

  const clearAuthError = React.useCallback(() => {
    setAuthError(null)
  }, [])

  const value = React.useMemo(
    () => ({
      authError,
      setAuthError,
      clearAuthError,
    }),
    [authError, clearAuthError]
  )

  return (
    <AuthErrorContext.Provider value={value}>
      {children}
    </AuthErrorContext.Provider>
  )
}

export function useAuthError() {
  const context = React.useContext(AuthErrorContext)
  if (!context) {
    throw new Error("useAuthError must be used within AuthErrorProvider")
  }
  return context
}

