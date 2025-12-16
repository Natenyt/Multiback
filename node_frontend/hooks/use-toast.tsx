"use client"

import * as React from "react"

interface Toast {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive"
  duration?: number
  playSound?: boolean
}

interface ToastContextType {
  toast: (props: { 
    title?: string
    description?: string
    variant?: "default" | "destructive"
    duration?: number
    playSound?: boolean
  }) => void
}

// Notification sound function
function playNotificationSound() {
  try {
    const audio = new Audio('/notification.mp3')
    audio.volume = 0.5 // Set volume to 50%
    audio.play().catch((error) => {
      console.error("Failed to play notification sound:", error)
    })
  } catch (error) {
    console.error("Failed to play notification sound:", error)
  }
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const toast = React.useCallback(
    ({ 
      title, 
      description, 
      variant = "default",
      duration = 3000,
      playSound = false
    }: { 
      title?: string
      description?: string
      variant?: "default" | "destructive"
      duration?: number
      playSound?: boolean
    }) => {
      const id = Math.random().toString(36).substring(7)
      setToasts((prev) => [...prev, { id, title, description, variant, duration, playSound }])
      
      // Play sound if requested
      if (playSound) {
        playNotificationSound()
      }
      
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, duration)
    },
    []
  )

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-md shadow-lg min-w-[320px] max-w-[420px] ${
              toast.variant === "destructive"
                ? "bg-destructive text-destructive-foreground"
                : "bg-background text-foreground border border-border"
            }`}
            style={{
              animation: 'slideInFromRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {toast.title && <div className="font-semibold text-sm">{toast.title}</div>}
            {toast.description && (
              <div className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                {toast.description}
              </div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    return {
      toast: ({ title, description, variant }: { title?: string; description?: string; variant?: "default" | "destructive" }) => {
        console.log("Toast:", title, description, variant)
      },
    }
  }
  return context
}

