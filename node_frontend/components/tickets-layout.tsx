"use client"

import * as React from "react"
import { TicketsTable } from "./tickets-table"
import { ChatView } from "./chat-view"

interface TicketsLayoutProps {
  status: "unassigned" | "assigned" | "archive"
}

export function TicketsLayout({ status }: TicketsLayoutProps) {
  const [selectedSessionId, setSelectedSessionId] = React.useState<string | null>(null)
  const [isChatOpen, setIsChatOpen] = React.useState(false)
  const [shouldRenderChat, setShouldRenderChat] = React.useState(false)
  const [refreshTrigger, setRefreshTrigger] = React.useState(0)

  const handlePreviewClick = (sessionId: string) => {
    // Prevent any scroll behavior
    const currentScrollY = window.scrollY
    setSelectedSessionId(sessionId)
    setIsChatOpen(true)
    setShouldRenderChat(true)
    // Restore scroll position immediately
    requestAnimationFrame(() => {
      window.scrollTo(0, currentScrollY)
    })
  }

  const handleCloseChat = () => {
    setIsChatOpen(false)
    // Keep selectedSessionId so we can reopen if needed
    // Don't unmount here - wait for animation complete callback
  }

  const handleAnimationComplete = () => {
    // Unmount only after animation fully completes
    setShouldRenderChat(false)
  }

  const handleAssign = (sessionId: string) => {
    // Trigger refresh of tickets table
    setRefreshTrigger((prev) => prev + 1)
    // Chat stays open, user can select another session or close
  }

  const handleEscalate = (sessionId: string) => {
    // Trigger refresh of tickets table
    setRefreshTrigger((prev) => prev + 1)
    // Close chat if this was the selected session
    if (selectedSessionId === sessionId) {
      setIsChatOpen(false)
      setSelectedSessionId(null)
    }
  }

  // Prevent scrolling when chat is open
  const tableContainerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (isChatOpen) {
      // Prevent body scroll
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      
      // Prevent scroll on table container
      const preventScroll = (e: WheelEvent | TouchEvent) => {
        e.preventDefault()
        e.stopPropagation()
      }

      const container = tableContainerRef.current
      if (container) {
        container.addEventListener('wheel', preventScroll, { passive: false })
        container.addEventListener('touchmove', preventScroll, { passive: false })
      }

      return () => {
        document.body.style.overflow = originalOverflow
        if (container) {
          container.removeEventListener('wheel', preventScroll)
          container.removeEventListener('touchmove', preventScroll)
        }
      }
    }
  }, [isChatOpen])

  return (
    <div className="flex h-full relative">
      {/* Table - takes remaining space when chat is open */}
      <div 
        ref={tableContainerRef}
        className={`flex-1 transition-all duration-300 ${isChatOpen ? "w-1/2" : "w-full"}`}
        style={isChatOpen ? { 
          pointerEvents: 'none', 
          userSelect: 'none'
        } : {}}
      >
        <TicketsTable
          status={status}
          onPreviewClick={handlePreviewClick}
          onAssign={handleAssign}
          onEscalate={handleEscalate}
          refreshTrigger={refreshTrigger}
        />
      </div>

      {/* Chat View - overlay, positioned fixed */}
      {shouldRenderChat && (
        <ChatView
          sessionId={selectedSessionId}
          isOpen={isChatOpen}
          onClose={handleCloseChat}
          mode={status === "unassigned" ? "unassigned" : status === "assigned" ? "assigned" : "archive"}
          onAssign={handleAssign}
          onAnimationComplete={handleAnimationComplete}
        />
      )}
    </div>
  )
}

