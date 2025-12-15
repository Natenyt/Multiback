"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { type SessionData, type Message, assignTicket } from "@/dash_department/lib/api"
import { CaseMessageList } from "./case-message-list"
import { CaseMessageInput } from "./case-message-input"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface CaseChatUIProps {
  session: SessionData
  initialMessages: Message[]
  initialNextCursor?: string | null
  sessionUuid: string
  onSessionAssigned?: () => void
}

export function CaseChatUI({ session, initialMessages, initialNextCursor, sessionUuid, onSessionAssigned }: CaseChatUIProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const [messages, setMessages] = React.useState<Message[]>(initialMessages)
  const [isAssigning, setIsAssigning] = React.useState(false)
  const [currentSession, setCurrentSession] = React.useState<SessionData>(session)
  const isUnassigned = !currentSession.assigned_staff
  const isClosed = currentSession.status === "closed"

  // Update local session when prop changes
  React.useEffect(() => {
    setCurrentSession(session)
  }, [session])

  const handleNewMessage = (newMessage: Message) => {
    setMessages((prev) => [...prev, newMessage])
  }

  const handleAssign = async () => {
    setIsAssigning(true)
    try {
      const response = await assignTicket(sessionUuid)
      toast({
        title: "Success",
        description: "Murojaat sizga tayinlandi",
      })
      // Update local session state
      setCurrentSession(response.session)
      // Notify parent component
      if (onSessionAssigned) {
        onSessionAssigned(response.session)
      }
      // Redirect to assigned route if currently on unassigned route
      if (pathname?.includes('/unassigned/')) {
        router.replace(`/dashboard/assigned/${sessionUuid}`)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign ticket",
        variant: "destructive",
      })
    } finally {
      setIsAssigning(false)
    }
  }

  return (
    <div className="w-[45%] h-full bg-muted dark:bg-muted/30 flex flex-col">
      {/* Header */}
      <div className="bg-background dark:bg-background h-auto p-4 flex items-center justify-between border-b">
        <div className="flex-1">
          <p className="text-base font-semibold text-foreground" style={{ fontFamily: 'Segoe UI Symbol, sans-serif' }}>
            {currentSession.citizen.full_name}, sID.{sessionUuid.slice(0, 7)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => router.back()}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-hidden">
        <CaseMessageList 
          messages={messages} 
          initialNextCursor={initialNextCursor}
          sessionUuid={sessionUuid} 
        />
      </div>

      {/* Input Area */}
      <div className="bg-muted dark:bg-muted/30 border-t">
        {isUnassigned ? (
          <div className="p-4 flex flex-col items-center justify-center gap-3">
            <p className="text-sm text-muted-foreground text-center" style={{ fontFamily: 'Segoe UI Symbol, sans-serif' }}>
              Iltimos, o'zingizni biriktirish uchun "Biriktirish" tugmasini bosing
            </p>
            <Button
              onClick={handleAssign}
              disabled={isAssigning}
              className="w-full bg-black dark:bg-white dark:text-black text-white hover:bg-black/80 dark:hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-[13px] font-medium h-8 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAssigning ? "Biriktirilmoqda..." : "Biriktirish"}
            </Button>
          </div>
        ) : isClosed ? (
          <div className="p-4 flex flex-col items-center justify-center">
            <div className="w-full border border-muted-foreground/20 rounded-md p-3 bg-muted/30">
              <p className="text-sm text-muted-foreground text-center" style={{ fontFamily: 'Segoe UI Symbol, sans-serif' }}>
                Yakunlangan murojaatlarga o'zgartirish yoki davom ettirish taqiqlanadi!
              </p>
            </div>
          </div>
        ) : (
        <CaseMessageInput
          sessionUuid={sessionUuid}
          onMessageSent={handleNewMessage}
        />
        )}
      </div>
    </div>
  )
}

