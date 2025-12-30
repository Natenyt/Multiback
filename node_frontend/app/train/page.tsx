"use client"

import * as React from "react"
import { TicketsTable } from "@/components/tickets-table"
import { useRouter } from "next/navigation"

export default function TrainingPage() {
  const router = useRouter()

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
        <TicketsTable
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


