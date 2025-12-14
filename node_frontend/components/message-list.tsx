"use client"

import * as React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Play, Download, Image as ImageIcon, Video as VideoIcon, File as FileIcon } from "lucide-react"
import { Poppins } from "next/font/google"
import type { Message } from "@/dash_department/lib/api"

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
})

interface MessageListProps {
  messages: Message[]
  currentUserId?: string
}

interface GroupedMessage extends Message {
  isLastInGroup: boolean
  isFirstInGroup: boolean
}

export function MessageList({ messages, currentUserId }: MessageListProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Group messages by 2-minute intervals
  const groupMessages = (messages: Message[]): GroupedMessage[] => {
    if (messages.length === 0) return []
    
    const grouped: GroupedMessage[] = []
    
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i]
      const nextMessage = messages[i + 1]
      
      let isLastInGroup = true
      let isFirstInGroup = false
      
      if (nextMessage) {
        const currentTime = new Date(message.created_at).getTime()
        const nextTime = new Date(nextMessage.created_at).getTime()
        const timeDiff = nextTime - currentTime
        const twoMinutes = 2 * 60 * 1000 // 2 minutes in milliseconds
        
        // If next message is within 2 minutes and from same sender, not last in group
        if (timeDiff <= twoMinutes && 
            message.sender.user_uuid === nextMessage.sender.user_uuid &&
            message.is_me === nextMessage.is_me) {
          isLastInGroup = false
        }
      }
      
      // First message or different sender than previous
      if (i === 0 || 
          (messages[i - 1].sender.user_uuid !== message.sender.user_uuid) ||
          (messages[i - 1].is_me !== message.is_me)) {
        isFirstInGroup = true
      }
      
      grouped.push({
        ...message,
        isLastInGroup,
        isFirstInGroup,
      })
    }
    
    return grouped
  }

  const groupedMessages = React.useMemo(() => groupMessages(messages), [messages])

  const renderContent = (content: Message["contents"][0]) => {
    switch (content.content_type) {
      case "text":
        return <p className="whitespace-pre-wrap" style={{ lineHeight: '16px', fontSize: '13px' }}>{content.text}</p>
      
      case "image":
        return (
          <div className="rounded-lg overflow-hidden max-w-xs">
            {content.thumbnail_url ? (
              <img
                src={content.thumbnail_url}
                alt={content.caption || "Image"}
                className="max-w-full h-auto cursor-pointer"
                onClick={() => {
                  if (content.file_url) {
                    window.open(content.file_url, "_blank")
                  }
                }}
              />
            ) : content.file_url ? (
              <img
                src={content.file_url}
                alt={content.caption || "Image"}
                className="max-w-full h-auto cursor-pointer"
              />
            ) : (
              <div className="flex items-center gap-2 p-4 bg-muted">
                <ImageIcon className="h-4 w-4" />
                <span className="text-sm">Image</span>
              </div>
            )}
            {content.caption && (
              <p className="mt-1" style={{ fontSize: '13px' }}>{content.caption}</p>
            )}
          </div>
        )
      
      case "video":
        return (
          <div className="rounded-lg overflow-hidden max-w-xs">
            {content.file_url ? (
              <video
                src={content.file_url}
                controls
                className="max-w-full h-auto"
              />
            ) : (
              <div className="flex items-center gap-2 p-4 bg-muted">
                <VideoIcon className="h-4 w-4" />
                <span className="text-sm">Video</span>
              </div>
            )}
            {content.caption && (
              <p className="mt-1" style={{ fontSize: '13px' }}>{content.caption}</p>
            )}
          </div>
        )
      
      case "voice":
        return (
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
            <Play className="h-4 w-4" />
            {content.file_url ? (
              <audio src={content.file_url} controls className="flex-1" />
            ) : (
              <span className="text-xs">Voice message</span>
            )}
          </div>
        )
      
      case "file":
        return (
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
            <FileIcon className="h-4 w-4" />
            <span className="text-xs flex-1">{content.caption || "File"}</span>
            {content.file_url && (
              <a
                href={content.file_url}
                download
                className="text-primary hover:underline"
              >
                <Download className="h-4 w-4" />
              </a>
            )}
          </div>
        )
      
      default:
        return <p className="text-xs">{content.text || "Unsupported content"}</p>
    }
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 p-4 flex items-center justify-center">
        <p className="text-muted-foreground">No messages yet</p>
      </div>
    )
  }

  const getBubbleRadius = (message: GroupedMessage, isMe: boolean) => {
    if (message.isLastInGroup) {
      // Last message in group: all corners 10px except bottom-left 0px (for left side) or bottom-right 0px (for right side)
      if (isMe) {
        return "rounded-tl-[10px] rounded-tr-[10px] rounded-bl-[10px] rounded-br-0"
      } else {
        return "rounded-tl-[10px] rounded-tr-[10px] rounded-bl-0 rounded-br-[10px]"
      }
    } else {
      // Previous messages in group
      if (isMe) {
        return "rounded-tl-[10px] rounded-tr-[10px] rounded-bl-[5px] rounded-br-[15px]"
      } else {
        return "rounded-tl-[10px] rounded-tr-[10px] rounded-bl-[15px] rounded-br-[5px]"
      }
    }
  }

  // Component for message bubble with smart timestamp positioning
  const MessageBubble = ({ 
    message, 
    isMe, 
    isStaff, 
    renderContent 
  }: { 
    message: GroupedMessage
    isMe: boolean
    isStaff: boolean
    renderContent: (content: Message["contents"][0]) => React.ReactNode
  }) => {
    const contentRef = React.useRef<HTMLDivElement>(null)
    const textRef = React.useRef<HTMLDivElement>(null)
    const [timestampPosition, setTimestampPosition] = React.useState<'inline' | 'block'>('block')

    React.useEffect(() => {
      if (!contentRef.current || !textRef.current) return

      const measureText = () => {
        const container = contentRef.current
        const textElement = textRef.current
        
        if (!container || !textElement) return

        // Get container width (accounting for padding)
        const containerStyle = getComputedStyle(container)
        const paddingLeft = parseFloat(containerStyle.paddingLeft)
        const paddingRight = parseFloat(containerStyle.paddingRight)
        const containerWidth = container.clientWidth - paddingLeft - paddingRight

        // Get text dimensions
        const textHeight = textElement.offsetHeight
        const textWidth = textElement.scrollWidth
        
        // Get line height
        const lineHeight = parseFloat(getComputedStyle(textElement).lineHeight) || 16
        const numberOfLines = Math.ceil(textHeight / lineHeight)

        // Rule 1: Short text (single line) - timestamp inline
        if (numberOfLines === 1) {
          setTimestampPosition('inline')
          return
        }

        // For multi-line text, measure last line width more accurately
        const textContent = textElement.textContent || ''
        if (!textContent.trim()) {
          setTimestampPosition('block')
          return
        }

        // Create a test element with same styling to measure accurately
        const testElement = document.createElement('div')
        const textStyles = getComputedStyle(textElement)
        testElement.style.position = 'absolute'
        testElement.style.visibility = 'hidden'
        testElement.style.whiteSpace = 'pre-wrap'
        testElement.style.width = `${containerWidth}px`
        testElement.style.fontSize = textStyles.fontSize
        testElement.style.fontFamily = textStyles.fontFamily
        testElement.style.fontWeight = textStyles.fontWeight
        testElement.style.lineHeight = textStyles.lineHeight
        testElement.style.letterSpacing = textStyles.letterSpacing
        testElement.style.wordSpacing = textStyles.wordSpacing
        testElement.style.padding = '0'
        testElement.style.margin = '0'
        testElement.textContent = textContent
        
        document.body.appendChild(testElement)
        
        const testHeight = testElement.offsetHeight
        const testLineHeight = parseFloat(textStyles.lineHeight) || 16
        const testLines = Math.ceil(testHeight / testLineHeight)
        
        // Find the last line by iterating from the end - more reliable than binary search
        const words = textContent.split(/\s+/)
        let lastLineStartIndex = words.length
        
        // Find where the last line starts by working backwards
        for (let i = words.length - 1; i >= 0; i--) {
          const testText = words.slice(0, i + 1).join(' ')
          testElement.textContent = testText
          const currentHeight = testElement.offsetHeight
          const currentLines = Math.ceil(currentHeight / testLineHeight)
          
          if (currentLines < testLines) {
            // This word started a new line, so last line starts at i + 1
            lastLineStartIndex = i + 1
            break
          }
        }
        
        // Fallback: if we didn't find it, assume last word is on its own line
        if (lastLineStartIndex >= words.length || lastLineStartIndex < 0) {
          lastLineStartIndex = Math.max(0, words.length - 1)
        }
        
        // Get the last line text
        const lastLineWords = words.slice(lastLineStartIndex)
        const lastLineText = lastLineWords.join(' ').trim()
        
        // If last line is empty, fallback to block positioning
        if (!lastLineText) {
          document.body.removeChild(testElement)
          setTimestampPosition('block')
          return
        }
        
        // Measure last line width by creating a single-line test element
        const lastLineTest = document.createElement('div')
        lastLineTest.style.position = 'absolute'
        lastLineTest.style.visibility = 'hidden'
        lastLineTest.style.whiteSpace = 'nowrap'
        lastLineTest.style.fontSize = textStyles.fontSize
        lastLineTest.style.fontFamily = textStyles.fontFamily
        lastLineTest.style.fontWeight = textStyles.fontWeight
        lastLineTest.style.letterSpacing = textStyles.letterSpacing
        lastLineTest.style.wordSpacing = textStyles.wordSpacing
        lastLineTest.textContent = lastLineText
        
        document.body.appendChild(lastLineTest)
        const lastLineWidth = lastLineTest.scrollWidth
        document.body.removeChild(lastLineTest)
        document.body.removeChild(testElement)

        // Estimate timestamp width (approximately 50px for "HH:MM" format)
        const timestampWidth = 50
        const gap = 6
        const totalNeeded = lastLineWidth + timestampWidth + gap

        // Rule 2: Last line is full (no space for timestamp) - timestamp on new line
        // Use a more lenient threshold (80% instead of 85%) to be more permissive
        // This ensures we only use block positioning when there's truly no space
        if (totalNeeded > containerWidth * 0.80) {
          setTimestampPosition('block')
          return
        }

        // Rule 3: Last line has space - timestamp inline (same as Rule 1 positioning)
        setTimestampPosition('inline')
      }

      // Debounce measurements to ensure consistency
      let measureTimeout: NodeJS.Timeout | null = null
      const debouncedMeasure = () => {
        if (measureTimeout) {
          clearTimeout(measureTimeout)
        }
        measureTimeout = setTimeout(() => {
          // Double-check that elements still exist
          if (contentRef.current && textRef.current) {
            measureText()
          }
        }, 50) // Increased delay for more stability
      }

      // Use ResizeObserver to detect size changes
      const resizeObserver = new ResizeObserver(() => {
        debouncedMeasure()
      })

      if (contentRef.current) {
        resizeObserver.observe(contentRef.current)
      }
      if (textRef.current) {
        resizeObserver.observe(textRef.current)
      }

      // Initial measurement with delay to ensure DOM is ready
      requestAnimationFrame(() => {
        setTimeout(debouncedMeasure, 100) // Longer initial delay
      })

      return () => {
        resizeObserver.disconnect()
        if (measureTimeout) {
          clearTimeout(measureTimeout)
        }
      }
    }, [message.contents])

    const timestamp = new Date(message.created_at).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })

    return (
      <div
        ref={contentRef}
        className={`px-4 py-2 max-w-[70%] ${poppins.className} ${
          isMe
            ? "bg-primary text-primary-foreground"
            : isStaff
            ? "bg-muted text-foreground"
            : "bg-white dark:bg-secondary text-gray-900 dark:text-secondary-foreground"
        } ${getBubbleRadius(message, isMe)}`}
      >
        {timestampPosition === 'inline' ? (
          <div className="w-full" style={{ lineHeight: '16px' }}>
            <div ref={textRef} className="inline" style={{ display: 'inline' }}>
              {message.contents.map((content, index) => (
                <React.Fragment key={index}>
                  {content.content_type === 'text' ? (
                    <span className="whitespace-pre-wrap" style={{ display: 'inline', lineHeight: '16px', fontSize: '13px' }}>
                      {content.text}
                    </span>
                  ) : (
                    <div>{renderContent(content)}</div>
                  )}
                </React.Fragment>
              ))}
            </div>
            <span className={`inline-flex items-baseline gap-1.5 ml-1.5 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`} style={{ verticalAlign: 'bottom', float: 'right', clear: 'right', marginLeft: '6px', paddingTop: '4px' }}>
              <span className="text-xs" style={{ lineHeight: '16px' }}>{timestamp}</span>
              {isMe && message.is_staff_message && message.delivered_at && (
                <div
                  className={`h-2 w-2 rounded-full ${
                    message.read_at ? "bg-blue-500" : "bg-white"
                  }`}
                  title={message.read_at ? "Read" : "Delivered"}
                />
              )}
            </span>
            <div style={{ clear: 'both' }}></div>
          </div>
        ) : (
          <>
            <div ref={textRef} className="block w-full" style={{ lineHeight: '16px' }}>
              {message.contents.map((content, index) => (
                <div key={index}>{renderContent(content)}</div>
              ))}
            </div>
            <div className="flex items-center gap-1.5 mt-1 justify-end">
              <span className={`text-xs ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`} style={{ lineHeight: '16px', paddingTop: '4px' }}>
                {timestamp}
              </span>
              {isMe && message.is_staff_message && message.delivered_at && (
                <div
                  className={`h-2 w-2 rounded-full ${
                    message.read_at ? "bg-blue-500" : "bg-white"
                  }`}
                  title={message.read_at ? "Read" : "Delivered"}
                />
              )}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1" style={{ padding: '16px 18px' }}>
      <div ref={scrollRef} className="space-y-[6px]">
        {groupedMessages.map((message) => {
          const isMe = Boolean(message.is_me || (currentUserId && message.sender.user_uuid === currentUserId))
          const isStaff = Boolean(message.is_staff_message)
          const showAvatar = !isMe && message.isLastInGroup

          return (
            <div
              key={message.message_uuid}
              className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"} items-end`}
              style={{ alignItems: 'flex-end', paddingBottom: '2px' }}
            >
              {/* Avatar - only show for last message in group from citizen */}
              <div className="flex-shrink-0" style={{ width: showAvatar ? '36px' : '0px', height: '36px', paddingBottom: '2px' }}>
                {showAvatar && (
                  <Avatar className="h-9 w-9" style={{ marginTop: '2px' }}>
                    {message.sender.avatar_url ? (
                      <AvatarImage src={message.sender.avatar_url} alt={message.sender.full_name} />
                    ) : null}
                    <AvatarFallback className="bg-blue-500 text-white">
                      {message.sender.full_name
                        ? message.sender.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)
                        : "U"}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>

              {/* Message bubble with smart timestamp positioning */}
              <MessageBubble
                message={message}
                isMe={isMe}
                isStaff={isStaff}
                renderContent={renderContent}
              />
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
