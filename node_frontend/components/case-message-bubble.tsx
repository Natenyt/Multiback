"use client"

import * as React from "react"
import { type Message } from "@/dash_department/lib/api"

interface CaseMessageBubbleProps {
  message: Message
  isGroupedWithPrevious?: boolean
  isGroupedWithNext?: boolean
}

export function CaseMessageBubble({
  message,
  isGroupedWithPrevious = false,
  isGroupedWithNext = false,
}: CaseMessageBubbleProps) {
  const [showTimestamp, setShowTimestamp] = React.useState(false)
  const timeoutRef = React.useRef<number | null>(null)

  const formatTimestamp = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const month = date.toLocaleDateString("en-US", { month: "short" })
      const day = date.getDate()
      const hours = date.getHours().toString().padStart(2, "0")
      const minutes = date.getMinutes().toString().padStart(2, "0")
      return `${month} ${day} ${hours}:${minutes}`
    } catch {
      return dateString
    }
  }

  const isStaff = message.is_staff_message === true
  const textContent = message.contents.find((c) => c.content_type === "text")?.text || ""

  // Calculate border radius classes based on grouping and sender type
  // Always start with rounded-lg, then explicitly use rounded-*-none to remove rounding
  const getBorderRadiusClasses = () => {
    // Always start with the full rounded baseline
    // Then explicitly "turn off" corners where we want square edges.
    // Use rounded-*-none to remove rounding for that corner.
    const base = "rounded-lg"

    // Debug logging
    console.log("Message bubble:", {
      isStaff,
      is_staff_message: message.is_staff_message,
      is_staff_message_type: typeof message.is_staff_message,
      isGroupedWithPrevious,
      isGroupedWithNext,
      message_uuid: message.message_uuid
    })

    // For staff (right side) we remove right corners when grouped
    if (message.is_staff_message === true) {
      const topRightNone = isGroupedWithPrevious ? "rounded-tr-none" : ""
      const bottomRightNone = isGroupedWithNext ? "rounded-br-none" : ""
      const result = `${base} ${topRightNone} ${bottomRightNone}`.trim()
      console.log("Staff message classes:", result)
      return result
    }

    // For citizen (left side) we remove left corners when grouped
    // Check explicitly for false or falsy values (null, undefined, false)
    if (message.is_staff_message === false || !message.is_staff_message) {
      const topLeftNone = isGroupedWithPrevious ? "rounded-tl-none" : ""
      const bottomLeftNone = isGroupedWithNext ? "rounded-bl-none" : ""
      const result = `${base} ${topLeftNone} ${bottomLeftNone}`.trim()
      console.log("Citizen message classes:", result)
      return result
    }

    // Fallback (shouldn't reach here, but just in case)
    console.log("Fallback - no condition matched, isStaff:", isStaff)
    return base
  }

  const handleBubbleClick = () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    // Toggle timestamp on click
    setShowTimestamp((prev) => {
      const newValue = !prev

      // If showing timestamp, set auto-hide after 3 seconds
      if (newValue) {
        timeoutRef.current = window.setTimeout(() => {
      setShowTimestamp(false)
        }, 3000)
      }
      
      return newValue
    })
  }

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <div className={`flex ${isStaff ? "justify-end" : "justify-start"} mb-1`}>
      <div className={`max-w-[70%] ${isStaff ? "items-end" : "items-start"} flex flex-col`}>
        <div
          onClick={handleBubbleClick}
          className={`${getBorderRadiusClasses()} px-4 py-2 transition-transform duration-150 cursor-pointer select-text
            ${isStaff ? "bg-background dark:bg-card text-foreground border border-border" : "bg-[#193BE5] dark:bg-[#2563eb] text-white"}`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{textContent}</p>
        </div>

        <div 
          className={`text-xs text-muted-foreground mt-1 px-1 transition-all duration-200 overflow-hidden
            ${showTimestamp ? "max-h-10 opacity-100 translate-y-0" : "max-h-0 opacity-0 translate-y-2"}`}
        >
          {formatTimestamp(message.created_at)}
        </div>
      </div>
    </div>
  )
}

