"use client"

import * as React from "react"
import Image from "next/image"
import { type Message, fetchAuthenticatedImage } from "@/dash_department/lib/api"

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
  // Cache for blob URLs to avoid refetching
  const blobUrlCache = React.useRef<Map<string, string>>(new Map())

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
              const [imageUrl, setImageUrl] = React.useState<string | null>(null)
              const [isLoading, setIsLoading] = React.useState(true)
              const [hasError, setHasError] = React.useState(false)
              
              // Determine source URL - prefer thumbnail, fallback to file_url
              const sourceUrl = content.thumbnail_url || content.file_url
              const cacheKey = sourceUrl || `content-${content.id}`
              
              React.useEffect(() => {
                if (!sourceUrl) {
                  setIsLoading(false)
                  setHasError(true)
                  return
                }

                // Check if it's already a blob URL (optimistic UI)
                if (sourceUrl.startsWith('blob:')) {
                  setImageUrl(sourceUrl)
                  setIsLoading(false)
                  return
                }

                // Check cache first
                const cached = blobUrlCache.current.get(cacheKey)
                if (cached) {
                  setImageUrl(cached)
                  setIsLoading(false)
                  return
                }

                // Check if it's an external URL (doesn't need auth)
                const isExternalUrl = sourceUrl.startsWith('http://') || sourceUrl.startsWith('https://')
                if (isExternalUrl && !sourceUrl.includes('/api/') && !sourceUrl.includes('/media/')) {
                  setImageUrl(sourceUrl)
                  setIsLoading(false)
                  return
                }

                // Fetch with authentication and convert to blob
                setIsLoading(true)
                fetchAuthenticatedImage(sourceUrl)
                  .then((blobUrl) => {
                    if (blobUrl) {
                      blobUrlCache.current.set(cacheKey, blobUrl)
                      setImageUrl(blobUrl)
                      setIsLoading(false)
                    } else {
                      setHasError(true)
                      setIsLoading(false)
                    }
                  })
                  .catch((error) => {
                    console.error('Error loading image:', error)
                    setHasError(true)
                    setIsLoading(false)
                  })
              }, [sourceUrl, cacheKey])

              // Cleanup blob URL on unmount
              React.useEffect(() => {
                return () => {
                  if (imageUrl && imageUrl.startsWith('blob:') && !sourceUrl?.startsWith('blob:')) {
                    // Only revoke if it's not the original optimistic blob URL
                    URL.revokeObjectURL(imageUrl)
                  }
                }
              }, [imageUrl, sourceUrl])

              return (
                <div
                  key={content.id}
                  className="relative rounded-lg overflow-hidden border border-border max-w-[200px] max-h-[200px] bg-muted"
                >
                  {isLoading ? (
                    <div className="w-[200px] h-[200px] bg-muted flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">Loading...</span>
                    </div>
                  ) : hasError || !imageUrl ? (
                    <div className="w-[200px] h-[200px] bg-muted flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">Image not available</span>
                    </div>
                  ) : (
                    <img
                      src={imageUrl}
                      alt={content.caption || "Image"}
                      className="object-cover w-full h-full cursor-pointer hover:opacity-90 transition-opacity max-w-[200px] max-h-[200px]"
                      onClick={() => {
                        // Open full size image if available
                        if (content.file_url && content.file_url !== sourceUrl) {
                          window.open(content.file_url, '_blank')
                        }
                      }}
                      onError={() => {
                        setHasError(true)
                      }}
                    />
                  )}
                  {content.caption && imageUrl && !hasError && (
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

