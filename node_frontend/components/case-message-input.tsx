"use client"

import * as React from "react"
import { sendMessage, type Message } from "@/dash_department/lib/api"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface CaseMessageInputProps {
  sessionUuid: string
  onMessageSent: (message: Message) => void
}

export function CaseMessageInput({ sessionUuid, onMessageSent }: CaseMessageInputProps) {
  const [inputValue, setInputValue] = React.useState("")
  const [isSending, setIsSending] = React.useState(false)
  const { toast } = useToast()

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return

    const textToSend = inputValue.trim()
    
    // Don't clear input yet - keep it until message is sent
    setIsSending(true)
    try {
      const response = await sendMessage(sessionUuid, {
        text: textToSend,
      })
      
      // Only clear input and add message after successful send
      // The WebSocket will handle adding the message to the chat
      // But we can also add it here as a fallback if WebSocket is slow
      if (onMessageSent) {
        onMessageSent(response.message)
      }
      
      // Clear input only after successful send
      setInputValue("")
    } catch (error) {
      console.error("Failed to send message:", error)
      
      // Don't clear input on error - user can retry
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
          disabled={isSending}
          className="flex-1 min-h-[40px] max-h-[120px] py-3 pl-4 pr-14 border-0 bg-transparent resize-none focus:outline-none focus:ring-0 text-foreground placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
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

