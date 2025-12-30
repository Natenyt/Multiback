"use client"

import * as React from "react"
import { sendMessage, type Message } from "@/dash_department/lib/api"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface CaseMessageInputProps {
  sessionUuid: string
  onMessageSent: (message: Message) => void
  onMessageUpdate?: (optimisticId: string, message: Message) => void
}

export function CaseMessageInput({ sessionUuid, onMessageSent, onMessageUpdate }: CaseMessageInputProps) {
  const [inputValue, setInputValue] = React.useState("")
  const [isSending, setIsSending] = React.useState(false)
  const { toast } = useToast()

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return

    const textToSend = inputValue.trim()
    
    // Create optimistic message immediately
    const optimisticId = `optimistic-${Date.now()}-${Math.random()}`
    const optimisticMessage: Message = {
      message_uuid: optimisticId,
      created_at: new Date().toISOString(),
      delivered_at: null,
      read_at: null,
      is_staff_message: true,
      is_me: true,
      sender_platform: 'web',
      sender: {
        user_uuid: null,
        full_name: 'You',
        avatar_url: null,
      },
      contents: [{
        id: 0,
        content_type: 'text',
        text: textToSend,
        file_url: null,
        thumbnail_url: null,
        telegram_file_id: null,
        media_group_id: null,
        created_at: new Date().toISOString(),
      }],
      optimisticId,
    }

    // Show optimistic message immediately
    onMessageSent(optimisticMessage)

    // Clear input immediately for better UX
    setInputValue("")

    setIsSending(true)
    try {
      const response = await sendMessage(sessionUuid, {
        text: textToSend,
      })
      
      // Update optimistic message with real data
      if (onMessageUpdate && optimisticId) {
        onMessageUpdate(optimisticId, response.message)
      } else {
        // Fallback: if no update handler, just add the real message
        onMessageSent(response.message)
      }
    } catch (error) {
      console.error("Failed to send message:", error)
      
      toast({
        title: "Xatolik",
        description: error instanceof Error ? error.message : "Xabarni yuborib bo'lmadi",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="p-4">
      <div className="relative flex items-end rounded-lg border-2 border-border dark:border-border bg-background dark:bg-background shadow-md hover:shadow-lg focus-within:border-primary dark:focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30 dark:focus-within:ring-primary/40 focus-within:shadow-lg transition-all duration-200">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Xabaringizni kiriting"
          className="flex-1 min-h-[40px] max-h-[120px] py-3 pl-4 pr-14 border-0 bg-transparent resize-none focus:outline-none focus:ring-0 text-foreground placeholder:text-muted-foreground"
          rows={1}
        />
        <Button
          onClick={handleSend}
          disabled={!inputValue.trim() || isSending}
          size="icon"
          className="absolute right-2 bottom-2 h-8 w-8 rounded-md bg-blue-500 dark:bg-white dark:text-black hover:bg-blue-600 dark:hover:bg-white/90 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <ArrowRight className="h-4 w-4 text-white dark:text-black" />
        </Button>
      </div>
    </div>
  )
}

