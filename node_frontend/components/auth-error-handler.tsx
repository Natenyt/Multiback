"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { clearAuthTokens } from "@/dash_department/lib/api"
import { useAuthError } from "@/contexts/auth-error-context"

export function AuthErrorHandler() {
  const router = useRouter()
  const { authError, clearAuthError } = useAuthError()

  if (!authError) return null

  // Check if it's an authentication error
  const isAuthError = 
    authError.message.includes('Authentication failed') ||
    authError.message.includes('authentication') ||
    authError.message.includes('token') ||
    authError.message.includes('unauthorized') ||
    authError.message.includes('401') ||
    authError.message.includes('403') ||
    authError.message.includes('not valid')

  if (!isAuthError) return null

  const handleLogin = () => {
    // Always hide the popup immediately
    clearAuthError()

    // Best-effort token cleanup (ignore any unexpected errors)
    try {
      clearAuthTokens()
    } catch (e) {
      console.error("Failed to clear auth tokens:", e)
    }

    router.push('/login')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <CardTitle>Autentifikatsiya xatosi</CardTitle>
          </div>
          <CardDescription>
            Sizning autentifikatsiya sessiyangiz tugagan yoki noto'g'ri
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Iltimos, qaytadan kirish uchun "Kirish" tugmasini bosing.
          </p>
          <Button onClick={handleLogin} className="w-full" size="lg">
            <LogIn className="mr-2 h-4 w-4" />
            Kirish
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

