"use client"

import * as React from "react"
import { TicketsTable } from "./tickets-table"
import { assignTicket, closeTicket } from "@/dash_department/lib/api"
import { useToast } from "@/hooks/use-toast"

interface TicketsLayoutProps {
  status: "unassigned" | "assigned" | "archive"
}

export function TicketsLayout({ status }: TicketsLayoutProps) {
  const [refreshTrigger, setRefreshTrigger] = React.useState(0)
  const { toast } = useToast()

  const handlePreviewClick = (sessionId: string) => {
    // TODO: Implement new preview design
    console.log("Preview clicked for session:", sessionId)
  }

  const handleAssign = async (sessionId: string) => {
    try {
      await assignTicket(sessionId)
      toast({
        title: "Success",
        description: "Bu Murojaat sizga biriktirildi, iltimos Faol Murojaatlar bo'limiga o'ting",
      })
      // Trigger refresh of tickets table to remove assigned session
      setRefreshTrigger((prev) => prev + 1)
    } catch (error) {
      console.error("Failed to assign ticket:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign ticket",
        variant: "destructive",
      })
    }
  }

  const handleEscalate = (sessionId: string) => {
    // Trigger refresh of tickets table to remove escalated session
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleClose = async (sessionId: string) => {
    try {
      await closeTicket(sessionId)
      toast({
        title: "Success",
        description: "Murojaat tugallandi",
      })
      // Trigger refresh of tickets table to remove closed session
      setRefreshTrigger((prev) => prev + 1)
    } catch (error) {
      console.error("Failed to close ticket:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to close ticket",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="h-full">
      <TicketsTable
        status={status === "archive" ? "closed" : status}
        onPreviewClick={handlePreviewClick}
        onAssign={handleAssign}
        onEscalate={handleEscalate}
        onClose={status === "assigned" ? handleClose : undefined}
        refreshTrigger={refreshTrigger}
      />
    </div>
  )
}

