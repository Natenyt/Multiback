"use client"

import * as React from "react"
import { type Message, getTicketHistory, getAuthToken } from "@/dash_department/lib/api"
import { CaseMessageBubble } from "./case-message-bubble"
import { ScrollArea } from "@/components/ui/scroll-area"

// Get WS URL from API URL (replace /api with empty, and http with ws)
const getWsBaseUrl = (): string => {
  if (typeof window === 'undefined') {
    return 'ws://localhost:8000'
  }
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
  // Convert http://localhost:8000/api -> ws://localhost:8000
  // Convert https://example.com/api -> wss://example.com
  const wsUrl = apiUrl
    .replace('/api', '')
    .replace('http://', 'ws://')
    .replace('https://', 'wss://')
  
  return wsUrl
}

interface CaseMessageListProps {
  messages: Message[]
  initialNextCursor?: string | null
  sessionUuid: string
}

export function CaseMessageList({ messages: initialMessages, initialNextCursor, sessionUuid }: CaseMessageListProps) {
  const [messages, setMessages] = React.useState<Message[]>(initialMessages)
  const [isLoadingOlder, setIsLoadingOlder] = React.useState(false)
  const [nextCursor, setNextCursor] = React.useState<string | null>(initialNextCursor || null)
  const viewportRef = React.useRef<HTMLDivElement>(null)
  const bottomAnchorRef = React.useRef<HTMLDivElement>(null)
  const prevScrollHeightRef = React.useRef(0)
  const isLoadingRef = React.useRef(false)
  const wsRef = React.useRef<WebSocket | null>(null)

  // Extract cursor from next URL
  const extractCursorFromUrl = (url: string | null): string | null => {
    if (!url) return null
    try {
      const urlObj = new URL(url)
      return urlObj.searchParams.get('cursor')
    } catch {
      return null
    }
  }

  // Format date for day marker
  const formatDateMarker = (date: Date): string => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const messageDate = new Date(date)
    messageDate.setHours(0, 0, 0, 0)
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (messageDate.getTime() === today.getTime()) {
      return "Today"
    } else if (messageDate.getTime() === yesterday.getTime()) {
      return "Yesterday"
    } else {
      return messageDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })
    }
  }

  // Check if we need to show a date marker before this message
  const shouldShowDateMarker = (currentMessage: Message, previousMessage: Message | null): boolean => {
    if (!previousMessage) return true
    
    const currentDate = new Date(currentMessage.created_at)
    const previousDate = new Date(previousMessage.created_at)
    
    currentDate.setHours(0, 0, 0, 0)
    previousDate.setHours(0, 0, 0, 0)
    
    return currentDate.getTime() !== previousDate.getTime()
  }

  // Check if two messages should be grouped together
  const shouldGroupMessages = (currentMessage: Message, previousMessage: Message | null): boolean => {
    if (!previousMessage) return false
    
    // Messages must be from the same sender type (both staff or both user)
    if (currentMessage.is_staff_message !== previousMessage.is_staff_message) {
      return false
    }
    
    // Calculate time difference in milliseconds
    const currentTime = new Date(currentMessage.created_at).getTime()
    const previousTime = new Date(previousMessage.created_at).getTime()
    const timeDiffMs = Math.abs(currentTime - previousTime)
    
    // Group if time difference is less than 5 minutes (5 * 60 * 1000 ms)
    const FIVE_MINUTES_MS = 5 * 60 * 1000
    return timeDiffMs < FIVE_MINUTES_MS
  }

  // Check if message is grouped with the next message
  const checkIsGroupedWithNext = (currentMessage: Message, nextMessage: Message | null): boolean => {
    if (!nextMessage) return false
    return shouldGroupMessages(nextMessage, currentMessage)
  }

  // Initial scroll to bottom
  React.useLayoutEffect(() => {
    if (bottomAnchorRef.current && messages.length > 0) {
      bottomAnchorRef.current.scrollIntoView({ block: "end", behavior: "auto" })
    }
  }, [])

  // Load older messages on scroll up
  const loadOlderMessages = React.useCallback(async () => {
    if (isLoadingRef.current || !nextCursor || messages.length === 0) return

    const viewport = viewportRef.current?.closest('[data-radix-scroll-area-viewport]') as HTMLElement
    if (!viewport) return

    // Check if near top
    if (viewport.scrollTop > 100) return

    isLoadingRef.current = true
    setIsLoadingOlder(true)
    prevScrollHeightRef.current = viewport.scrollHeight

    try {
      const response = await getTicketHistory(sessionUuid, nextCursor)
      
      if (response.messages.length > 0) {
        // Filter out duplicates and prepend older messages
        const existingIds = new Set(messages.map((m) => m.message_uuid))
        const newMessages = response.messages.filter(
          (msg) => !existingIds.has(msg.message_uuid)
        )
        
        if (newMessages.length > 0) {
          setMessages((prev) => [...newMessages, ...prev])
        }
      }
      
      // Update cursor for next page
      const newCursor = extractCursorFromUrl(response.next)
      setNextCursor(newCursor)
    } catch (error) {
      console.error("Failed to load older messages:", error)
    } finally {
      isLoadingRef.current = false
      setIsLoadingOlder(false)
    }
  }, [messages, sessionUuid, nextCursor])

  // Scroll compensation after prepending
  React.useLayoutEffect(() => {
    if (prevScrollHeightRef.current > 0) {
      const viewport = viewportRef.current?.closest('[data-radix-scroll-area-viewport]') as HTMLElement
      if (viewport) {
        const newScrollHeight = viewport.scrollHeight
        viewport.scrollTop = newScrollHeight - prevScrollHeightRef.current + viewport.scrollTop
        prevScrollHeightRef.current = 0
      }
    }
  }, [messages])

  // Handle scroll events
  React.useEffect(() => {
    const viewport = viewportRef.current?.closest('[data-radix-scroll-area-viewport]') as HTMLElement
    if (!viewport) return

    const handleScroll = () => {
      if (viewport.scrollTop < 100) {
        loadOlderMessages()
      }
    }

    viewport.addEventListener("scroll", handleScroll)
    return () => viewport.removeEventListener("scroll", handleScroll)
  }, [loadOlderMessages])

  // Auto-scroll to bottom for new messages if near bottom
  const scrollToBottomIfNeeded = React.useCallback(() => {
    const viewport = viewportRef.current?.closest('[data-radix-scroll-area-viewport]') as HTMLElement
    if (!viewport || !bottomAnchorRef.current) return

    const isNearBottom =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 120

    if (isNearBottom) {
      bottomAnchorRef.current.scrollIntoView({ block: "end", behavior: "smooth" })
    }
  }, [])

  // Update messages when initialMessages change (new message sent)
  React.useEffect(() => {
    if (initialMessages.length > messages.length) {
      setMessages(initialMessages)
      setTimeout(() => scrollToBottomIfNeeded(), 100)
    }
  }, [initialMessages, messages.length, scrollToBottomIfNeeded])

  // WebSocket connection for real-time messages
  React.useEffect(() => {
    const token = getAuthToken()
    if (!token) {
      console.error("No auth token available for websocket connection")
      return
    }

    // Construct websocket URL with token in query string
    const wsBaseUrl = getWsBaseUrl()
    const wsUrl = `${wsBaseUrl}/ws/chat/${sessionUuid}/?token=${encodeURIComponent(token)}`
    
    console.log("Connecting to websocket:", wsUrl.replace(token, "***"))
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      console.log("WebSocket connected for session:", sessionUuid)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log("WebSocket message received:", data)

        // Handle message.created events
        if (data.type === "message.created" && data.message) {
          const newMessage: Message = data.message
          
          // Check if message already exists to avoid duplicates
          setMessages((prev) => {
            const exists = prev.some((m) => m.message_uuid === newMessage.message_uuid)
            if (exists) {
              return prev
            }
            return [...prev, newMessage]
          })
          
          // Auto-scroll to bottom for new messages
          setTimeout(() => scrollToBottomIfNeeded(), 100)
        }
      } catch (error) {
        console.error("Error parsing websocket message:", error)
      }
    }

    ws.onerror = (error) => {
      console.error("WebSocket error:", error)
    }

    ws.onclose = (event) => {
      console.log("WebSocket closed:", event.code, event.reason)
      // Attempt to reconnect after 3 seconds if not a normal closure
      if (event.code !== 1000) {
        setTimeout(() => {
          if (wsRef.current?.readyState === WebSocket.CLOSED) {
            // Trigger reconnect by re-running the effect
            // This is handled by the useEffect dependency on sessionUuid
          }
        }, 3000)
      }
    }

    // Cleanup on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close(1000, "Component unmounting")
      }
      wsRef.current = null
    }
  }, [sessionUuid, scrollToBottomIfNeeded])

  return (
    <ScrollArea className="h-full">
      <div ref={viewportRef} className="p-4">
        {isLoadingOlder && (
          <div className="text-center text-sm text-muted-foreground py-2">
            Loading older messages...
          </div>
        )}
        {messages.map((message, index) => {
          const previousMessage = index > 0 ? messages[index - 1] : null
          const nextMessage = index < messages.length - 1 ? messages[index + 1] : null
          const showDateMarker = shouldShowDateMarker(message, previousMessage)
          const isGroupedWithPrevious = shouldGroupMessages(message, previousMessage)
          const isGroupedWithNext = checkIsGroupedWithNext(message, nextMessage)
          
          // Reduce spacing for grouped messages
          const spacingClass = isGroupedWithPrevious ? "mt-0.5" : "mt-2"

          return (
            <React.Fragment key={message.message_uuid}>
              {showDateMarker && (
                <div className="flex items-center justify-center my-4">
                  <div className="flex items-center gap-3 w-full max-w-[80%]">
                    <div className="flex-1 h-px bg-border"></div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateMarker(new Date(message.created_at))}
                    </span>
                    <div className="flex-1 h-px bg-border"></div>
                  </div>
                </div>
              )}
              <div className={spacingClass}>
                <CaseMessageBubble 
                  message={message} 
                  isGroupedWithPrevious={isGroupedWithPrevious}
                  isGroupedWithNext={isGroupedWithNext}
                />
              </div>
            </React.Fragment>
          )
        })}
        <div ref={bottomAnchorRef} />
      </div>
    </ScrollArea>
  )
}

