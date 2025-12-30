"use client"

import * as React from "react"
import { TicketsTable } from "./tickets-table"
import { assignTicket, closeTicket } from "@/dash_department/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useNotifications } from "@/contexts/notification-context"
import { useAuthError } from "@/contexts/auth-error-context"

interface TicketsLayoutProps {
  status: "unassigned" | "assigned" | "archive" | "escalated"
}

export function TicketsLayout({ status }: TicketsLayoutProps) {
  const [refreshTrigger, setRefreshTrigger] = React.useState(0)
  const { toast } = useToast()
  const { addAssignedSession, addClosedSession } = useNotifications()
  const { setAuthError } = useAuthError()

  const handlePreviewClick = (sessionId: string) => {
    // TODO: Implement new preview design
    console.log("Preview clicked for session:", sessionId)
  }

  const handleAssign = async (sessionId: string) => {
    try {
      await assignTicket(sessionId)
      // Invalidate dashboard stats cache
      const { invalidateDashboardStats } = await import("@/hooks/use-dashboard-data")
      invalidateDashboardStats()
      // Track the assigned session
      addAssignedSession(sessionId)
      toast({
        title: "Murojaat biriktirildi",
        description: "Bu Murojaat sizga biriktirildi, iltimos Faol Murojaatlar bo'limiga o'ting",
        playSound: true,
        duration: 5000,
      })
      // Trigger refresh of tickets table to remove assigned session
      setRefreshTrigger((prev) => prev + 1)
    } catch (error) {
      console.error("Failed to assign ticket:", error)
      // If authentication error, set error in context
      if (error instanceof Error && (
        error.message.includes('token') ||
        error.message.includes('authentication') ||
        error.message.includes('not valid') ||
        error.message.includes('Authentication failed')
      )) {
        setAuthError(error)
      } else {
        toast({
          title: "Xatolik",
          description: error instanceof Error ? error.message : "Murojaatni biriktirib bo'lmadi",
          variant: "destructive",
        })
      }
    }
  }

  const handleEscalate = (sessionId: string) => {
    // Trigger refresh of tickets table to remove escalated session
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleClose = async (sessionId: string) => {
    try {
      await closeTicket(sessionId)
      // Invalidate dashboard stats cache
      const { invalidateDashboardStats } = await import("@/hooks/use-dashboard-data")
      invalidateDashboardStats()
      // Track the closed session
      addClosedSession(sessionId)
      toast({
        title: "Murojaat tugallandi",
        description: "Murojaat muvaffaqiyatli yopildi",
        playSound: true,
        duration: 5000,
      })
      // Trigger refresh of tickets table to remove closed session
      setRefreshTrigger((prev) => prev + 1)
    } catch (error) {
      console.error("Failed to close ticket:", error)
      // If authentication error, set error in context
      if (error instanceof Error && (
        error.message.includes('token') ||
        error.message.includes('authentication') ||
        error.message.includes('not valid') ||
        error.message.includes('Authentication failed')
      )) {
        setAuthError(error)
      } else {
        toast({
          title: "Xatolik",
          description: error instanceof Error ? error.message : "Murojaatni yopib bo'lmadi",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <div className="h-full">
      <TicketsTable
        status={status === "archive" ? "closed" : status === "escalated" ? "escalated" : status}
        onPreviewClick={handlePreviewClick}
        onAssign={handleAssign}
        onEscalate={handleEscalate}
        onClose={status === "assigned" ? handleClose : undefined}
        refreshTrigger={refreshTrigger}
      />
    </div>
  )
}

