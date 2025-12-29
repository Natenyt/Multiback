"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { getTicketHistory, type TicketHistoryResponse, type SessionData } from "@/dash_department/lib/api"
import { CaseDetailSection } from "@/components/case-detail-section"
import { CaseChatUI } from "@/components/case-chat-ui"

export default function ClosedCaseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const sessionUuid = params.session_uuid as string
  
  const [data, setData] = React.useState<TicketHistoryResponse | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const handleSessionUpdate = React.useCallback((updatedSession: SessionData) => {
    setData((prevData) => {
      if (prevData) {
        return {
          ...prevData,
          session: updatedSession
        }
      }
      return prevData
    })
  }, [])

  const fetchData = React.useCallback(async () => {
    if (!sessionUuid) return

    try {
      setIsLoading(true)
      setError(null)
      const response = await getTicketHistory(sessionUuid)
      setData(response)
    } catch (err) {
      console.error("Failed to fetch case data:", err)
      setError(err instanceof Error ? err.message : "Failed to load case")
    } finally {
      setIsLoading(false)
    }
  }, [sessionUuid])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading case...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || "Case not found"}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <CaseDetailSection 
        session={data.session} 
        sessionUuid={sessionUuid}
        onSessionUpdate={handleSessionUpdate}
      />
      <CaseChatUI 
        session={data.session} 
        initialMessages={data.messages}
        initialNextCursor={data.next}
        sessionUuid={sessionUuid}
        onSessionAssigned={handleSessionUpdate}
      />
    </div>
  )
}


