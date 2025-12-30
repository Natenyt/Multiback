"use client"

import { TicketsLayout } from "@/components/tickets-layout"

export default function TrainingPage() {
  return (
    <div className="h-full p-6">
      <h1 className="text-2xl font-bold mb-6">Escalated Murojaatlar</h1>
      <div className="h-[calc(100vh-200px)]">
        <TicketsLayout status="escalated" />
      </div>
    </div>
  )
}


