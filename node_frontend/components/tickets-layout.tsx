"use client"

import * as React from "react"
import { TicketsTable } from "./tickets-table"
import { ChatView } from "./chat-view"
import { assignTicket, closeTicket } from "@/dash_department/lib/api"
import { useToast } from "@/hooks/use-toast"

interface TicketsLayoutProps {
  status: "unassigned" | "assigned" | "archive"
}

export function TicketsLayout({ status }: TicketsLayoutProps) {
  const [selectedSessionId, setSelectedSessionId] = React.useState<string | null>(null)
  const [isChatOpen, setIsChatOpen] = React.useState(false)
  const [shouldRenderChat, setShouldRenderChat] = React.useState(false)
  const [refreshTrigger, setRefreshTrigger] = React.useState(0)
  const { toast } = useToast()

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

  const handleAssign = async (sessionId: string) => {
    try {
      await assignTicket(sessionId)
      toast({
        title: "Success",
        description: "Bu Murojaat sizga tayinlandi, iltimos Tayinlangan bo'limiga o'ting",
      })
      // Trigger refresh of tickets table to remove assigned session
      setRefreshTrigger((prev) => prev + 1)
      // Chat stays open, user can select another session or close
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
    // Close chat immediately
    setIsChatOpen(false)
    setSelectedSessionId(null)
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
      // Close chat if this was the selected session
      if (selectedSessionId === sessionId) {
        setIsChatOpen(false)
        setSelectedSessionId(null)
      }
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
          status={status === "archive" ? "closed" : status}
          onPreviewClick={handlePreviewClick}
          onAssign={handleAssign}
          onEscalate={handleEscalate}
          onClose={status === "assigned" ? handleClose : undefined}
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
          onEscalate={handleEscalate}
          onAnimationComplete={handleAnimationComplete}
        />
      )}
    </div>
  )
}

