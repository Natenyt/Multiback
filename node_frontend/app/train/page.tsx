"use client"

import * as React from "react"
import { TicketsLayout } from "@/components/tickets-layout"
import { useRouter } from "next/navigation"
import { useNotifications } from "@/contexts/notification-context"

export default function TrainingPage() {
  const router = useRouter()
  const { clearEscalatedSessions } = useNotifications()

  // Clear escalated sessions when viewing training page
  React.useEffect(() => {
    clearEscalatedSessions()
  }, [clearEscalatedSessions])

  const handlePreviewClick = (sessionId: string) => {
    router.push(`/train/${sessionId}`)
  }

  const handleAssign = () => {
    // No-op for training page
  }

  const handleEscalate = () => {
    // No-op for training page
  }

  return (
    <div className="h-full p-6">
      <h1 className="text-2xl font-bold mb-6">Escalated Murojaatlar</h1>
      <div className="h-[calc(100vh-200px)]">
        <TicketsLayout
          status="escalated"
          onPreviewClick={handlePreviewClick}
          onAssign={handleAssign}
          onEscalate={handleEscalate}
          refreshTrigger={0}
        />
      </div>
    </div>
  )
}


