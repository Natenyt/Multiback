"use client"

import * as React from "react"
import Image from "next/image"
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
  const imageContents = message.contents.filter((c) => c.content_type === "image")
  const hasImages = imageContents.length > 0
  const sendingStatus = message.sendingStatus
  const showStatusIndicator = isStaff && sendingStatus && sendingStatus !== 'sent'

  // Calculate border radius classes based on grouping and sender type
  // Always start with rounded-lg, then explicitly use rounded-*-none to remove rounding
  const getBorderRadiusClasses = () => {
    // Always start with the full rounded baseline
    // Then explicitly "turn off" corners where we want square edges.
    // Use rounded-*-none to remove rounding for that corner.
    const base = "rounded-lg"

    // For staff (right side) we remove right corners when grouped
    if (message.is_staff_message === true) {
      const topRightNone = isGroupedWithPrevious ? "rounded-tr-none" : ""
      const bottomRightNone = isGroupedWithNext ? "rounded-br-none" : ""
      return `${base} ${topRightNone} ${bottomRightNone}`.trim()
    }

    // For citizen (left side) we remove left corners when grouped
    // Check explicitly for false or falsy values (null, undefined, false)
    if (message.is_staff_message === false || !message.is_staff_message) {
      const topLeftNone = isGroupedWithPrevious ? "rounded-tl-none" : ""
      const bottomLeftNone = isGroupedWithNext ? "rounded-bl-none" : ""
      return `${base} ${topLeftNone} ${bottomLeftNone}`.trim()
    }

    // Fallback (shouldn't reach here, but just in case)
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
        {/* Images */}
        {hasImages && (
          <div className={`flex flex-wrap gap-2 mb-2 ${isStaff ? "justify-end" : "justify-start"}`}>
            {imageContents.map((content) => {
              // Determine image URL - prefer thumbnail, fallback to file_url
              const imageUrl = content.thumbnail_url || content.file_url
              // Check if it's a blob URL (optimistic) or external URL
              const isBlobUrl = imageUrl?.startsWith('blob:')
              const isAbsoluteUrl = imageUrl?.startsWith('http://') || imageUrl?.startsWith('https://')
              
              return (
                <div
                  key={content.id}
                  className="relative rounded-lg overflow-hidden border border-border max-w-[200px] max-h-[200px] bg-muted"
                >
                  {imageUrl ? (
                    // Use regular img for blob URLs and external URLs to avoid Next.js Image issues
                    isBlobUrl || !isAbsoluteUrl ? (
                      <img
                        src={imageUrl}
                        alt={content.caption || "Image"}
                        className="object-cover w-full h-full cursor-pointer hover:opacity-90 transition-opacity max-w-[200px] max-h-[200px]"
                        onClick={() => {
                          if (content.file_url && content.file_url !== imageUrl) {
                            window.open(content.file_url, '_blank')
                          }
                        }}
                        onError={(e) => {
                          // Fallback on error
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          const parent = target.parentElement
                          if (parent) {
                            const fallback = document.createElement('div')
                            fallback.className = 'w-full h-full flex items-center justify-center bg-muted'
                            fallback.innerHTML = '<span class="text-xs text-muted-foreground">Image not available</span>'
                            parent.appendChild(fallback)
                          }
                        }}
                      />
                    ) : (
                      // Use Next.js Image for relative URLs (if any)
                      <Image
                        src={imageUrl}
                        alt={content.caption || "Image"}
                        width={200}
                        height={200}
                        className="object-cover w-full h-full cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => {
                          if (content.file_url && content.file_url !== imageUrl) {
                            window.open(content.file_url, '_blank')
                          }
                        }}
                        unoptimized
                        onError={() => {
                          // Fallback handled by Next.js Image
                        }}
                      />
                    )
                  ) : (
                    <div className="w-[200px] h-[200px] bg-muted flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">Loading...</span>
                    </div>
                  )}
                  {content.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2">
                      {content.caption}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Text Content */}
        {textContent && (
          <div
            onClick={handleBubbleClick}
            className={`${getBorderRadiusClasses()} px-4 py-2 transition-transform duration-150 cursor-pointer select-text relative
              ${isStaff ? "bg-background dark:bg-card text-foreground border border-border" : "bg-[#193BE5] dark:bg-[#2563eb] text-white"}`}
          >
            <p className="text-sm whitespace-pre-wrap break-words">{textContent}</p>
            {/* Status Indicator - only for staff messages */}
            {showStatusIndicator && (
              <div
                className={`absolute bottom-1 right-1 w-2 h-2 rounded-full transition-colors duration-300 ${
                  sendingStatus === 'sending' ? 'bg-blue-400' : sendingStatus === 'failed' ? 'bg-red-400' : 'bg-green-500'
                }`}
                title={sendingStatus === 'sending' ? 'Sending...' : sendingStatus === 'failed' ? 'Failed' : 'Sent'}
              />
            )}
          </div>
        )}
        
        {/* Status Indicator for image-only messages (staff) */}
        {hasImages && !textContent && showStatusIndicator && (
          <div className="relative">
            <div
              className={`absolute bottom-1 right-1 w-2 h-2 rounded-full transition-colors duration-300 z-10 ${
                sendingStatus === 'sending' ? 'bg-blue-400' : sendingStatus === 'failed' ? 'bg-red-400' : 'bg-green-500'
              }`}
              title={sendingStatus === 'sending' ? 'Sending...' : sendingStatus === 'failed' ? 'Failed' : 'Sent'}
            />
          </div>
        )}

        {/* Timestamp */}
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

