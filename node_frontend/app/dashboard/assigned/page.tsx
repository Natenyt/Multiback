"use client"

import { TicketsLayout } from "@/components/tickets-layout"

export default function AssignedPage() {
  return (
    <div className="h-full p-6">
      <h1 className="text-2xl font-bold mb-6">Tayinlangan</h1>
      <div className="h-[calc(100vh-200px)]">
        <TicketsLayout status="assigned" />
      </div>
    </div>
  )
}

