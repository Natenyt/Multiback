"use client"

import { TicketsLayout } from "@/components/tickets-layout"

export default function ArchivePage() {
  return (
    <div className="h-full p-6">
      <h1 className="text-2xl font-bold mb-6">Arxiv</h1>
      <div className="h-[calc(100vh-200px)]">
        <TicketsLayout status="archive" />
      </div>
    </div>
  )
}

