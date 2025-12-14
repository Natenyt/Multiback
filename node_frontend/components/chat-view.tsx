"use client"

import * as React from "react"
import { X, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { MessageList } from "./message-list"
import { MessageInput } from "./message-input"
import {
  getTicketHistory,
  sendMessage,
  assignTicket,
  escalateTicket,
  type TicketHistoryResponse,
  type Message,
} from "@/dash_department/lib/api"
import { getAuthToken } from "@/dash_department/lib/api"
import { useToast } from "@/hooks/use-toast"

interface ChatViewProps {
  sessionId: string | null
  isOpen: boolean
  onClose: () => void
  mode: "unassigned" | "assigned" | "archive"
  onAssign?: (sessionId: string) => void
  onAnimationComplete?: () => void
}

export function ChatView({
  sessionId,
  isOpen,
  onClose,
  mode,
  onAssign,
  onAnimationComplete,
}: ChatViewProps) {
  const [history, setHistory] = React.useState<TicketHistoryResponse | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSending, setIsSending] = React.useState(false)
  const [isVisible, setIsVisible] = React.useState(false)
  const chatRef = React.useRef<HTMLDivElement>(null)
  const { toast } = useToast()
   
   // Chat width is always 40% of viewport minus expanded sidebar width (256px)
   // This keeps the width consistent regardless of sidebar collapse state
   const chatWidth = "calc((100vw - 256px) * 0.4)"

   // Handle opening animation
   React.useEffect(() => {
     if (isOpen) {
       // Explicitly set to false to ensure initial state
       setIsVisible(false)
       // Force a reflow to ensure the initial state is painted
       if (chatRef.current) {
         chatRef.current.offsetHeight // Force reflow
       }
       // Use requestAnimationFrame to ensure DOM is ready before triggering animation
       // Double RAF ensures browser has painted the initial state
       const rafId = requestAnimationFrame(() => {
         requestAnimationFrame(() => {
           setIsVisible(true)
         })
       })
       return () => cancelAnimationFrame(rafId)
     } else {
       // Closing: animate out
       setIsVisible(false)
       
       // Listen for transition end to know exactly when animation completes
       const handleTransitionEnd = (e: TransitionEvent) => {
         // Only handle the 'right' property transition
         if (e.propertyName === 'right' && chatRef.current && e.target === chatRef.current) {
           if (onAnimationComplete) {
             onAnimationComplete()
           }
           chatRef.current.removeEventListener('transitionend', handleTransitionEnd)
         }
       }
       
       // Add listener immediately - transition will start on next frame
       if (chatRef.current) {
         chatRef.current.addEventListener('transitionend', handleTransitionEnd)
       }
       
       return () => {
         if (chatRef.current) {
           chatRef.current.removeEventListener('transitionend', handleTransitionEnd)
         }
       }
     }
   }, [isOpen, onAnimationComplete])

    React.useEffect(() => {
      if (isOpen && sessionId) {
        fetchHistory()
        
        // Poll for new messages every 5 seconds, but only append new ones
        const interval = setInterval(() => {
          fetchNewMessages()
        }, 5000)
        
        return () => clearInterval(interval)
      } else {
        setHistory(null)
      }
    }, [isOpen, sessionId])

    // Handle ESC key to close chat
    React.useEffect(() => {
      if (!isOpen) return

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose()
        }
      }

      window.addEventListener('keydown', handleEscape)
      return () => window.removeEventListener('keydown', handleEscape)
    }, [isOpen, onClose])

  const fetchHistory = async () => {
    if (!sessionId) return

    try {
      setIsLoading(true)
      const data = await getTicketHistory(sessionId)
      setHistory(data)
    } catch (error) {
      console.error("Failed to fetch chat history:", error)
      toast({
        title: "Error",
        description: "Failed to load chat history",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchNewMessages = async () => {
    if (!sessionId || !history) return

    try {
      // Get the most recent message timestamp
      const lastMessageTime = history.messages.length > 0 
        ? new Date(history.messages[history.messages.length - 1].created_at).getTime()
        : 0

      const data = await getTicketHistory(sessionId)
      
      // Find new messages (created after our last message)
      const newMessages = data.messages.filter(msg => {
        const msgTime = new Date(msg.created_at).getTime()
        return msgTime > lastMessageTime
      })

      if (newMessages.length > 0) {
        // Append new messages to existing history
        setHistory(prev => {
          if (!prev) return data
          return {
            ...prev,
            messages: [...prev.messages, ...newMessages],
          }
        })
      }
    } catch (error) {
      console.error("Failed to fetch new messages:", error)
      // Silently fail for polling - don't show toast
    }
  }

  const handleSendMessage = async (text: string, files?: File[]) => {
    if (!sessionId) return

    try {
      setIsSending(true)
      const response = await sendMessage(sessionId, {
        text: text || undefined,
        files,
      })
      
      // Add new message to history
      if (history) {
        setHistory({
          ...history,
          messages: [...history.messages, response.message],
        })
      } else {
        // Refresh history if we don't have it yet
        await fetchHistory()
      }
    } catch (error) {
      console.error("Failed to send message:", error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleVoiceSend = async (blob: Blob) => {
    if (!sessionId) return

    try {
      setIsSending(true)
      const response = await sendMessage(sessionId, {
        voiceBlob: blob,
      })
      
      // Add new message to history
      if (history) {
        setHistory({
          ...history,
          messages: [...history.messages, response.message],
        })
      } else {
        await fetchHistory()
      }
    } catch (error) {
      console.error("Failed to send voice message:", error)
      toast({
        title: "Error",
        description: "Failed to send voice message",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleAssign = async () => {
    if (!sessionId) return

    try {
      setIsSending(true)
      await assignTicket(sessionId)
      
      toast({
        title: "Success",
        description: "Bu Murojaat sizga tayinlandi, iltimos Tayinlangan bo'limiga o'ting",
      })

      // Call parent callback to update list
      if (onAssign) {
        onAssign(sessionId)
      }

      // Refresh history to get updated session data
      await fetchHistory()
    } catch (error) {
      console.error("Failed to assign ticket:", error)
      toast({
        title: "Error",
        description: "Failed to assign ticket",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleEscalate = async () => {
    if (!sessionId) return

    try {
      setIsSending(true)
      await escalateTicket(sessionId)
      
      toast({
        title: "Success",
        description: "Ticket escalated successfully",
      })

      // Refresh history
      await fetchHistory()
    } catch (error) {
      console.error("Failed to escalate ticket:", error)
      toast({
        title: "Error",
        description: "Failed to escalate ticket",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const session = history?.session
  const citizen = session?.citizen
  const isDisabled =
    mode === "unassigned" ||
    (session?.status === "closed" && !session?.assigned_staff)

  // Get current user ID for message list
  const token = getAuthToken()
  // We'll need to get user ID from token or profile - for now, use is_me from messages

  return (
    <>
      {/* Backdrop overlay - behind chat UI */}
      <div 
        className="fixed inset-0 bg-black/40 dark:bg-black/60" 
        style={{ 
          opacity: isVisible ? 1 : 0, 
          zIndex: 40,
          transition: `opacity 0.4s ${isVisible ? 'cubic-bezier(0.4, 0, 0.2, 1)' : 'cubic-bezier(0, 0, 0.2, 1)'}`,
        }}
        onClick={onClose}
      />
      
      <div 
        ref={chatRef}
        className="fixed flex flex-col rounded-l-3xl rounded-r-none border overflow-hidden bg-[var(--chat-bg)] border-[var(--chat-border)]" 
        style={{ 
          top: 0, 
          right: isVisible ? 0 : `calc(-1 * ${chatWidth})`,
          height: '100vh', 
          width: chatWidth,
          padding: 0,
          boxShadow: 'var(--chat-shadow)',
          zIndex: 50,
          transition: 'right 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)', // Smooth ease for both directions
          willChange: 'right', // Hint to browser for optimization
        }}
      >
        {/* Header - sticky at top */}
        <div className="sticky top-0 z-10 border-b flex flex-row items-center justify-between pb-3 px-4 pt-3 bg-[var(--chat-header)] border-[var(--chat-border)]" style={{ padding: '12px 18px' }}>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">
              {citizen?.full_name || "Unknown Citizen"}
            </h3>
            <p 
              className="text-sm text-muted-foreground font-mono cursor-pointer hover:text-foreground transition-colors" 
              style={{ marginLeft: '1px' }}
              onClick={async () => {
                if (sessionId) {
                  try {
                    await navigator.clipboard.writeText(sessionId)
                    toast({
                      title: "Copied",
                      description: "Session ID copied to clipboard",
                    })
                  } catch (error) {
                    console.error("Failed to copy:", error)
                  }
                }
              }}
            >
              {sessionId?.slice(0, 8)}...
            </p>
          </div>
          <div className="flex items-center gap-2">
          {mode === "unassigned" ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEscalate}
                  disabled={isSending}
                  className="h-[34px] dark:bg-input/30 dark:border-input dark:hover:bg-input/50 flex items-center justify-center"
                >
                  <AlertTriangle className="h-4 w-4 text-red-500" style={{ marginRight: '4px' }} />
                  Escalate
                </Button>
              </TooltipTrigger>
              <TooltipContent style={{ paddingTop: '7px', paddingBottom: '7px' }}>
                <p>Agar bu murojaat sizning bo'limingizga tegishli emas deb hisoblasangiz, bosing!</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEscalate}
                    disabled={isSending}
                    className="h-[34px] flex items-center justify-center"
                  >
                    <AlertTriangle className="h-4 w-4 text-red-500" style={{ marginRight: '4px' }} />
                    Escalate
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Agar bu murojaat sizning bo'limingizga tegishli emas deb hisoblasangiz, bosing</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100"
            onClick={onClose}
          >
            <X className="h-5 w-5 text-white dark:text-black" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 flex flex-col p-0 overflow-hidden" style={{ padding: 0 }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading messages...</p>
          </div>
        ) : history ? (
          <MessageList
            messages={history.messages}
            currentUserId={undefined} // Will be determined from is_me field
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No session selected</p>
          </div>
        )}
      </div>

      {/* Input or Assign Button */}
      {mode === "unassigned" ? (
        <div className="p-4 border-t bg-[var(--chat-input)] border-[var(--chat-border)]" style={{ padding: '16px 18px' }}>
          <Button
            className="w-full dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
            onClick={handleAssign}
            disabled={isSending}
          >
            Tayinlash
          </Button>
        </div>
      ) : (
        <div className="border-t bg-[var(--chat-input)] border-[var(--chat-border)]" style={{ padding: 0 }}>
          <MessageInput
            onSend={handleSendMessage}
            onVoiceSend={handleVoiceSend}
            disabled={isDisabled || isSending}
          />
        </div>
      )}
      </div>
    </>
  )
}

