"use client"

import * as React from "react"
import { TicketsLayout } from "@/components/tickets-layout"
import { useNotifications } from "@/contexts/notification-context"

export default function UnassignedPage() {
  const { clearNotifications } = useNotifications()

  React.useEffect(() => {
    // When the operator opens the unassigned list, treat all unassigned notifications as seen
    clearNotifications()
  }, [clearNotifications])

  return (
    <div className="h-full p-6">
      <h1 className="text-2xl font-bold mb-6">Yangi Murojatlar</h1>
      <div className="h-[calc(100vh-200px)]">
        <TicketsLayout status="unassigned" />
      </div>
    </div>
  )
}

