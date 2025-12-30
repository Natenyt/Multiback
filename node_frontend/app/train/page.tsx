"use client"

import * as React from "react"
import { TicketsLayout } from "@/components/tickets-layout"
import { useNotifications } from "@/contexts/notification-context"

export default function TrainingPage() {
  const { clearEscalatedSessions } = useNotifications()

  // Clear escalated sessions when viewing training page
  React.useEffect(() => {
    clearEscalatedSessions()
  }, [clearEscalatedSessions])

  return (
    <div className="h-full p-6">
      <h1 className="text-2xl font-bold mb-6">Escalated Murojaatlar</h1>
      <div className="h-[calc(100vh-200px)]">
        <TicketsLayout status="escalated" />
      </div>
    </div>
  )
}


