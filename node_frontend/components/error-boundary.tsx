"use client"

import * as React from "react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error | null; resetError: () => void }>
}

/**
 * React Error Boundary component to catch and handle errors gracefully
 * Prevents the entire app from crashing when a component throws an error
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console for debugging
    console.error("ErrorBoundary caught an error:", error, errorInfo)
    
    // Update state with error details
    this.setState({
      error,
      errorInfo,
    })

    // TODO: In production, you might want to log this to an error reporting service
    // Example: logErrorToService(error, errorInfo)
  }

  handleReset = () => {
    // Reset error state to allow user to try again
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleGoHome = () => {
    // Navigate to home page
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  render() {
    if (this.state.hasError) {
      // If custom fallback is provided, use it
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} resetError={this.handleReset} />
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <CardTitle>Xatolik yuz berdi</CardTitle>
              </div>
              <CardDescription>
                Kechirasiz, ilova ishlashda muammo yuz berdi. Iltimos, qayta urinib ko'ring.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && (
                <div className="bg-muted p-4 rounded-md">
                  <p className="text-sm font-mono text-destructive">
                    {this.state.error.message || "Noma'lum xatolik"}
                  </p>
                  {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="text-sm text-muted-foreground cursor-pointer">
                        Texnik ma'lumotlar
                      </summary>
                      <pre className="mt-2 text-xs overflow-auto max-h-60 bg-background p-2 rounded">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={this.handleReset} variant="default">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Qayta urinib ko'rish
                </Button>
                <Button onClick={this.handleGoHome} variant="outline">
                  <Home className="mr-2 h-4 w-4" />
                  Bosh sahifaga qaytish
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Hook to manually trigger error boundary (useful for testing)
 * Note: This doesn't actually throw an error, it's just for reference
 */
export function useErrorHandler() {
  return React.useCallback((error: Error) => {
    throw error
  }, [])
}

