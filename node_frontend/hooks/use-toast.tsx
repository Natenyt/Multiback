"use client"

import * as React from "react"

interface Toast {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

interface ToastContextType {
  toast: (props: { title?: string; description?: string; variant?: "default" | "destructive" }) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const toast = React.useCallback(
    ({ title, description, variant = "default" }: { title?: string; description?: string; variant?: "default" | "destructive" }) => {
      const id = Math.random().toString(36).substring(7)
      setToasts((prev) => [...prev, { id, title, description, variant }])
      
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 3000)
    },
    []
  )

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-md shadow-lg ${
              toast.variant === "destructive"
                ? "bg-destructive text-destructive-foreground"
                : "bg-black dark:bg-background text-white dark:text-foreground border dark:border"
            }`}
            style={{
              animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {toast.title && <div className="font-semibold">{toast.title}</div>}
            {toast.description && <div className="text-sm">{toast.description}</div>}
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

